package com.logview.ssr

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.time.Instant

/**
 * Kotlin SSR (Server-Side Rendering) Library
 * 
 * Provides TSX-like component rendering for Kotlin with:
 * - Component composition
 * - State management
 * - Event handling
 * - HTML generation
 */

// Component interfaces
interface Component {
    fun render(context: RenderContext): String
}

interface ComponentProps {
    val children: List<Component>?
    val className: String?
    val style: Map<String, String>?
    val onClick: (() -> Unit)?
    val onChange: ((String) -> Unit)?
}

// Render context
data class RenderContext(
    val state: Map<String, Any>,
    val props: Map<String, Any>,
    val events: MutableMap<String, () -> Unit>,
    val styles: MutableMap<String, String>
)

// Base component class
abstract class BaseComponent : Component {
    protected fun div(
        className: String? = null,
        style: Map<String, String>? = null,
        onClick: (() -> Unit)? = null,
        children: (() -> List<Component>)? = null
    ): DivComponent {
        return DivComponent(className, style, onClick, children?.invoke())
    }

    protected fun button(
        text: String,
        className: String? = null,
        onClick: (() -> Unit)? = null
    ): ButtonComponent {
        return ButtonComponent(text, className, onClick)
    }

    protected fun input(
        type: String = "text",
        placeholder: String? = null,
        value: String? = null,
        className: String? = null,
        onChange: ((String) -> Unit)? = null
    ): InputComponent {
        return InputComponent(type, placeholder, value, className, onChange)
    }

    protected fun h1(text: String, className: String? = null): H1Component {
        return H1Component(text, className)
    }

    protected fun h2(text: String, className: String? = null): H2Component {
        return H2Component(text, className)
    }

    protected fun h3(text: String, className: String? = null): H3Component {
        return H3Component(text, className)
    }

    protected fun p(text: String, className: String? = null): PComponent {
        return PComponent(text, className)
    }

    protected fun span(text: String, className: String? = null): SpanComponent {
        return SpanComponent(text, className)
    }
}

// HTML Components
class DivComponent(
    private val className: String?,
    private val style: Map<String, String>?,
    private val onClick: (() -> Unit)?,
    private val children: List<Component>?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        val styleAttr = style?.let { 
            " style=\"${it.map { (k, v) -> "$k:$v" }.joinToString(";")}\"" 
        } ?: ""
        val onClickAttr = onClick?.let {
            val eventId = "event_${System.currentTimeMillis()}"
            context.events[eventId] = it
            " onclick=\"$eventId()\""
        } ?: ""

        val childrenHtml = children?.joinToString("") { it.render(context) } ?: ""
        
        return "<div$classAttr$styleAttr$onClickAttr>$childrenHtml</div>"
    }
}

class ButtonComponent(
    private val text: String,
    private val className: String?,
    private val onClick: (() -> Unit)?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        val onClickAttr = onClick?.let {
            val eventId = "event_${System.currentTimeMillis()}"
            context.events[eventId] = it
            " onclick=\"$eventId()\""
        } ?: ""

        return "<button$classAttr$onClickAttr>$text</button>"
    }
}

class InputComponent(
    private val type: String,
    private val placeholder: String?,
    private val value: String?,
    private val className: String?,
    private val onChange: ((String) -> Unit)?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        val placeholderAttr = placeholder?.let { " placeholder=\"$it\"" } ?: ""
        val valueAttr = value?.let { " value=\"$it\"" } ?: ""
        val onChangeAttr = onChange?.let {
            val eventId = "event_${System.currentTimeMillis()}"
            context.events[eventId] = { onChange("") }
            " onchange=\"$eventId()\""
        } ?: ""

        return "<input type=\"$type\"$classAttr$placeholderAttr$valueAttr$onChangeAttr />"
    }
}

class H1Component(
    private val text: String,
    private val className: String?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        return "<h1$classAttr>$text</h1>"
    }
}

class H2Component(
    private val text: String,
    private val className: String?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        return "<h2$classAttr>$text</h2>"
    }
}

class H3Component(
    private val text: String,
    private val className: String?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        return "<h3$classAttr>$text</h3>"
    }
}

class PComponent(
    private val text: String,
    private val className: String?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        return "<p$classAttr>$text</p>"
    }
}

class SpanComponent(
    private val text: String,
    private val className: String?
) : Component {
    override fun render(context: RenderContext): String {
        val classAttr = className?.let { " class=\"$it\"" } ?: ""
        return "<span$classAttr>$text</span>"
    }
}

// State machine integration
class KotlinViewStateMachine<TModel : Any>(
    private val machineId: String,
    private val initialState: TModel
) {
    private val logEntries = mutableListOf<LogEntry>()
    private val stateHandlers = mutableMapOf<String, suspend (StateContext<TModel>) -> Component>()
    private val currentState = MutableSharedFlow<TModel>()

    data class LogEntry(
        val id: String,
        val timestamp: Instant,
        val level: String,
        val message: String,
        val metadata: Map<String, Any>? = null
    )

    data class StateContext<TModel>(
        val state: String,
        val model: TModel,
        val log: suspend (String, Map<String, Any>?) -> Unit,
        val view: (Component) -> String,
        val clear: () -> Unit,
        val transition: (String) -> Unit,
        val send: (Any) -> Unit,
        val updateModel: (TModel) -> Unit
    )

    fun withState(stateName: String, handler: suspend (StateContext<TModel>) -> Component): KotlinViewStateMachine<TModel> {
        stateHandlers[stateName] = handler
        return this
    }

    suspend fun executeState(stateName: String, model: TModel): String {
        val handler = stateHandlers[stateName] ?: return ""
        
        val context = createStateContext(stateName, model)
        val component = handler(context)
        return component.render(createRenderContext(model))
    }

    private fun createStateContext(stateName: String, model: TModel): StateContext<TModel> {
        return StateContext(
            state = stateName,
            model = model,
            log = { message, metadata ->
                val logEntry = LogEntry(
                    id = System.currentTimeMillis().toString(),
                    timestamp = Instant.now(),
                    level = "INFO",
                    message = message,
                    metadata = metadata
                )
                logEntries.add(logEntry)
            },
            view = { component ->
                component.render(createRenderContext(model))
            },
            clear = {
                // TODO: Implement view clearing
            },
            transition = { toState ->
                // TODO: Implement state transition
            },
            send = { event ->
                // TODO: Implement event sending
            },
            updateModel = { newModel ->
                // TODO: Implement model update
            }
        )
    }

    private fun createRenderContext(model: TModel): RenderContext {
        return RenderContext(
            state = mapOf("model" to model),
            props = emptyMap(),
            events = mutableMapOf(),
            styles = mutableMapOf()
        )
    }

    fun getLogs(): List<LogEntry> = logEntries.toList()
}

// Example Fish Burger Component
class FishBurgerComponent : BaseComponent() {
    override fun render(context: RenderContext): String {
        return div(
            className = "fish-burger-container",
            style = mapOf(
                "padding" to "20px",
                "background" to "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "min-height" to "100vh",
                "color" to "white"
            )
        ) {
            listOf(
                h1("🍔 Fish Burger System", "title"),
                div(className = "controls") {
                    listOf(
                        button("Start Cooking", "btn btn-primary") { /* onClick */ },
                        button("Update Progress", "btn btn-secondary") { /* onClick */ },
                        button("Complete Cooking", "btn btn-success") { /* onClick */ },
                        button("Reset", "btn btn-danger") { /* onClick */ }
                    )
                },
                div(className = "status") {
                    listOf(
                        h3("Current Status: ${context.state["currentState"] ?: "idle"}"),
                        p("Order ID: ${context.state["orderId"] ?: "-"}"),
                        p("Cooking Time: ${context.state["cookingTime"] ?: "0"} seconds"),
                        p("Temperature: ${context.state["temperature"] ?: "0"}°C")
                    )
                },
                div(className = "logs") {
                    listOf(
                        h3("Logs"),
                        div(className = "log-entries") {
                            // Log entries would be rendered here
                            listOf(p("System initialized"))
                        }
                    )
                }
            )
        }.render(context)
    }
}

// Example usage
object KotlinSSRExample {
    suspend fun runExample() {
        val machine = KotlinViewStateMachine<Map<String, Any>>(
            machineId = "fish-burger",
            initialState = mapOf(
                "currentState" to "idle",
                "orderId" to null,
                "cookingTime" to 0,
                "temperature" to 0
            )
        )

        machine.withState("idle") { context ->
            context.log("Fish Burger system is idle")
            FishBurgerComponent()
        }

        val html = machine.executeState("idle", machine.initialState)
        println("Generated HTML:")
        println(html)
    }
} 