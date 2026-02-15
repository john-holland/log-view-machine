package com.logview.example.tastyfishburger

import com.logview.core.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.time.Instant
import java.util.UUID

class TastyFishBurgerStateMachine : BaseStateMachine<FishBurgerData, State>() {
    override val name = "tastyfishburger"
    override val superMachine = "kitchen"
    override val subMachines = emptyList<BaseStateMachine<FishBurgerData, State>>()
    override val location = "kitchen"

    private val _stateUpdates = MutableSharedFlow<StateMachineUpdate>()
    val stateUpdates: SharedFlow<StateMachineUpdate> = _stateUpdates

    private val _messageUpdates = MutableSharedFlow<MessageUpdate>()
    val messageUpdates: SharedFlow<MessageUpdate> = _messageUpdates

    // Add ViewStateMachine wrapper
    private val viewStateMachine = ViewStateMachine("tastyfishburger", this)
    private val logViewMachine = LogViewMachineImpl()

    data class FishBurgerData(
        val orderId: String,
        val ingredients: List<String>,
        val cookingTime: Int,
        val temperature: Double
    )

    init {
        // Configure ViewStateMachine with fluent API
        viewStateMachine
            .withState("idle") { context: ViewStateMachine.StateContext<FishBurgerData> ->
                context.log("Fish burger machine is idle", mapOf("orderId" to "none"))
            }
            .withState("processing") { context: ViewStateMachine.StateContext<FishBurgerData> ->
                context.log("Starting to cook fish burger", mapOf("orderId" to context.model.orderId))
                // Simulate cooking process
                kotlinx.coroutines.delay(2000)
                context.log("Fish burger cooking in progress", mapOf(
                    "orderId" to context.model.orderId,
                    "cookingTime" to context.model.cookingTime,
                    "temperature" to context.model.temperature
                ))
            }
            .withState("completed") { context: ViewStateMachine.StateContext<FishBurgerData> ->
                context.log("Fish burger cooking completed", mapOf("orderId" to context.model.orderId))
            }
            .withState("error") { context: ViewStateMachine.StateContext<FishBurgerData> ->
                context.log("Error occurred while cooking fish burger", mapOf("orderId" to context.model.orderId))
            }
    }

    override suspend fun executeTransition(transition: Transition<State>) {
        when (transition.to) {
            is State.Processing -> {
                // Execute ViewStateMachine state handler
                viewStateMachine.executeState("processing", currentModel as FishBurgerData)
                
                // Emit state update
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.STATE_CHANGED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            is State.Completed -> {
                // Execute ViewStateMachine state handler
                viewStateMachine.executeState("completed", currentModel as FishBurgerData)
                
                // Emit state update
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.STATE_CHANGED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            is State.Error -> {
                // Execute ViewStateMachine state handler
                viewStateMachine.executeState("error", currentModel as FishBurgerData)
                
                // Emit state update
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.ERROR_OCCURRED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            else -> {
                // Execute ViewStateMachine state handler for idle
                viewStateMachine.executeState("idle", currentModel as FishBurgerData)
            }
        }
    }

    suspend fun startCooking(orderId: String, ingredients: List<String>) {
        val data = FishBurgerData(
            orderId = orderId,
            ingredients = ingredients,
            cookingTime = 0,
            temperature = 0.0
        )
        
        // Log the start of cooking
        logViewMachine.addLog(LogEntry(
            id = "",
            timestamp = Instant.EPOCH,
            level = "INFO",
            message = "Starting fish burger cooking",
            metadata = mapOf("orderId" to orderId, "ingredients" to ingredients),
            tags = listOf("cooking", "start")
        ))
        
        sendMessage("~/kitchen/tastyfishburger/start", data)
    }

    suspend fun updateCookingProgress(orderId: String, cookingTime: Int, temperature: Double) {
        val currentData = currentModel as? FishBurgerData
        if (currentData?.orderId == orderId) {
            val updatedData = currentData.copy(
                cookingTime = cookingTime,
                temperature = temperature
            )
            
            // Log cooking progress
            logViewMachine.addLog(LogEntry(
                id = "",
                timestamp = Instant.EPOCH,
                level = "INFO",
                message = "Cooking progress updated",
                metadata = mapOf(
                    "orderId" to orderId,
                    "cookingTime" to cookingTime,
                    "temperature" to temperature
                ),
                tags = listOf("cooking", "progress")
            ))
            
            sendMessage("~/kitchen/tastyfishburger/progress", updatedData)
        }
    }

    suspend fun completeCooking(orderId: String) {
        val currentData = currentModel as? FishBurgerData
        if (currentData?.orderId == orderId) {
            // Log completion
            logViewMachine.addLog(LogEntry(
                id = "",
                timestamp = Instant.EPOCH,
                level = "INFO",
                message = "Fish burger cooking completed",
                metadata = mapOf("orderId" to orderId),
                tags = listOf("cooking", "completed")
            ))
            
            sendMessage("~/kitchen/tastyfishburger/complete", currentData)
        }
    }

    // Expose ViewStateMachine and LogViewMachine for external access
    fun getViewStateMachine(): ViewStateMachine<FishBurgerData> = viewStateMachine
    fun getLogViewMachine(): LogViewMachine = logViewMachine

    override suspend fun sendMessage(address: String, data: FishBurgerData) {
        super.sendMessage(address, data)
        
        // Emit message update
        _messageUpdates.emit(MessageUpdate(
            type = UpdateType.MESSAGE_RECEIVED,
            message = Message(
                id = UUID.randomUUID().toString(),
                csrfToken = csrfToken,
                requestToken = generateRequestToken(),
                requestId = "request:${UUID.randomUUID()}",
                salt = UUID.randomUUID().toString(),
                hash = generateHash(data, csrfToken),
                data = data,
                from = currentState?.from ?: State.Initial,
                to = currentState?.to ?: State.Processing,
                send = Instant.now()
            ),
            timestamp = Instant.now()
        ))
    }
} 