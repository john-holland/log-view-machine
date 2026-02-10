package com.logview.causality

/**
 * Runnable demo: Fish Burger-style machine (idle -> cooking -> completed)
 * with undo/redo. Run from core: main class com.logview.causality.UndoRedoDemo
 */
object UndoRedoDemo {

    @JvmStatic
    fun main(args: Array<String>) {
        val config = MachineConfig(
            id = "fish-burger-causality",
            initial = "idle",
            context = FishBurgerContext(orderId = null, cookingTime = 0),
            states = mapOf(
                "idle" to StateNodeConfig(on = mapOf(
                    "START" to TransitionTarget.state("cooking")
                )),
                "cooking" to StateNodeConfig(on = mapOf(
                    "DONE" to TransitionTarget.state("completed"),
                    "TICK" to TransitionTarget.state("cooking")
                )),
                "completed" to StateNodeConfig(on = mapOf(
                    "RESET" to TransitionTarget.state("idle")
                ))
            )
        )

        val service = interpret(createMachine(config))

        println("Initial: ${service.value} ${service.context}")

        service.send("START") { ctx, _ ->
            ctx.copy(orderId = "ORD-1", cookingTime = 0)
        }
        println("After START: ${service.value} ${service.context}")

        service.send("TICK") { ctx, _ ->
            ctx.copy(cookingTime = ctx.cookingTime + 10)
        }
        service.send("TICK") { ctx, _ ->
            ctx.copy(cookingTime = ctx.cookingTime + 10)
        }
        println("After 2 TICK: ${service.value} ${service.context}")

        service.send("DONE") { ctx, _ -> ctx }
        println("After DONE: ${service.value} ${service.context}")

        println("Undo...")
        service.undo()
        println("  -> ${service.value} ${service.context}")
        service.undo()
        println("  -> ${service.value} ${service.context}")
        service.undo()
        println("  -> ${service.value} ${service.context}")

        println("Redo...")
        service.redo()
        println("  -> ${service.value} ${service.context}")

        println("Send again (clears redo)...")
        service.send("TICK") { ctx, _ -> ctx.copy(cookingTime = ctx.cookingTime + 5) }
        println("  -> ${service.value} canRedo=${service.canRedo()}")

        println("Done.")
    }

    data class FishBurgerContext(
        val orderId: String?,
        val cookingTime: Int
    )
}
