package com.logview.causality;

/**
 * Immutable state machine definition (XState-congruent).
 * Created via StateMachine.create(config).
 */
public final class StateMachine<T> {

    private final MachineConfig<T> config;

    private StateMachine(MachineConfig<T> config) {
        this.config = config;
    }

    public static <T> StateMachine<T> create(MachineConfig<T> config) {
        return new StateMachine<>(config);
    }

    public String getId() { return config.getId(); }
    public String getInitial() { return config.getInitial(); }
    public T getContext() { return config.getInitialContext(); }
    public MachineConfig<T> getConfig() { return config; }
}
