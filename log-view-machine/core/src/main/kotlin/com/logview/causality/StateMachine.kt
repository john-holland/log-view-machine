package com.logview.causality

/**
 * Immutable state machine definition (XState-congruent).
 * Created via createMachine(config).
 */
class StateMachine<T> private constructor(
    val config: MachineConfig<T>
) {
    val id: String? get() = config.id
    val initial: String get() = config.initial
    val context: T get() = config.getInitialContext()

    companion object {
        fun <T> create(config: MachineConfig<T>): StateMachine<T> =
            StateMachine(config)
    }
}

/** Convenience: createMachine(config) */
fun <T> createMachine(config: MachineConfig<T>): StateMachine<T> =
    StateMachine.create(config)
