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

    data class FishBurgerData(
        val orderId: String,
        val ingredients: List<String>,
        val cookingTime: Int,
        val temperature: Double
    )

    override suspend fun executeTransition(transition: Transition<State>) {
        when (transition.to) {
            is State.Processing -> {
                // Start cooking the burger
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.STATE_CHANGED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            is State.Completed -> {
                // Burger is ready
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.STATE_CHANGED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            is State.Error -> {
                // Handle cooking error
                _stateUpdates.emit(StateMachineUpdate(
                    type = UpdateType.ERROR_OCCURRED,
                    stateMachine = this,
                    timestamp = Instant.now()
                ))
            }
            else -> {}
        }
    }

    suspend fun startCooking(orderId: String, ingredients: List<String>) {
        val data = FishBurgerData(
            orderId = orderId,
            ingredients = ingredients,
            cookingTime = 0,
            temperature = 0.0
        )
        sendMessage("~/kitchen/tastyfishburger/start", data)
    }

    suspend fun updateCookingProgress(orderId: String, cookingTime: Int, temperature: Double) {
        val currentData = currentModel as? FishBurgerData
        if (currentData?.orderId == orderId) {
            val updatedData = currentData.copy(
                cookingTime = cookingTime,
                temperature = temperature
            )
            sendMessage("~/kitchen/tastyfishburger/progress", updatedData)
        }
    }

    suspend fun completeCooking(orderId: String) {
        val currentData = currentModel as? FishBurgerData
        if (currentData?.orderId == orderId) {
            sendMessage("~/kitchen/tastyfishburger/complete", currentData)
        }
    }

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
                from = currentState?.from ?: State.Initial(),
                to = currentState?.to ?: State.Processing(),
                send = Instant.now()
            ),
            timestamp = Instant.now()
        ))
    }
} 