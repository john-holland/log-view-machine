package com.logview.causality;

import java.util.Collections;
import java.util.Map;

/**
 * Per-state config: map of event key -> transition target.
 */
public final class StateNodeConfig {

    private final Map<String, TransitionTarget> on;

    public StateNodeConfig(Map<String, TransitionTarget> on) {
        this.on = on != null ? Map.copyOf(on) : Collections.emptyMap();
    }

    public StateNodeConfig() {
        this(Collections.emptyMap());
    }

    public Map<String, TransitionTarget> getOn() {
        return on;
    }
}
