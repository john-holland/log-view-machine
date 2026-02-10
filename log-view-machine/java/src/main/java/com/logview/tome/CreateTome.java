package com.logview.tome;

/**
 * Factory for TomeInstance. Builds machines from TomeConfig and returns a TomeInstance.
 * Aligns with TS createTome (browser-safe, no Express).
 */
public final class CreateTome {

    private CreateTome() {}

    /**
     * Create a TomeInstance from config. Each machine in config.machines is built as
     * MachineConfig -> StateMachine -> Interpreter -> ViewStateMachine facade.
     */
    public static TomeInstance createTome(TomeConfig config) {
        if (config == null) {
            throw new IllegalArgumentException("config is required");
        }
        return new DefaultTomeInstance(config);
    }
}
