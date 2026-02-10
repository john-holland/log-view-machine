package com.logview.causality;

import java.util.Collections;
import java.util.Map;
import java.util.Set;

/**
 * Reserved event key for manual/override transitions (e.g. setState without sending an event).
 * Used so every transition has a "cause" (normal event or override); undo-to-root includes overrides.
 */
public final class MachineConfig<T> {

    public static final String OVERRIDE_EVENT = "__override";

    private final String id;
    private final String initial;
    private final T context;
    private final Map<String, StateNodeConfig> states;
    private final Map<String, TransitionTarget> rootOn;

    public MachineConfig(String id, String initial, T context,
                         Map<String, StateNodeConfig> states,
                         Map<String, TransitionTarget> rootOn) {
        this.id = id;
        this.initial = initial;
        this.context = context;
        this.states = states != null ? Map.copyOf(states) : Collections.emptyMap();
        this.rootOn = rootOn != null ? Map.copyOf(rootOn) : null;
    }

    public MachineConfig(String initial, T context, Map<String, StateNodeConfig> states) {
        this(null, initial, context, states, null);
    }

    public String getId() { return id; }
    public String getInitial() { return initial; }
    public T getInitialContext() { return context; }
    public Map<String, StateNodeConfig> getStates() { return states; }
    public Map<String, TransitionTarget> getOn() { return rootOn; }

    /**
     * Resolve transition for event from a state (state's on or root on).
     */
    public String resolveTransition(String currentState, Object event) {
        String eventKey = eventToString(event);
        StateNodeConfig stateConfig = states.get(currentState);
        TransitionTarget transition = null;
        if (stateConfig != null && stateConfig.getOn().containsKey(eventKey)) {
            transition = stateConfig.getOn().get(eventKey);
        }
        if (transition == null && rootOn != null) {
            transition = rootOn.get(eventKey);
        }
        return transition != null ? transition.getTarget() : null;
    }

    String eventToString(Object event) {
        if (event == null) return "null";
        if (event instanceof String) return (String) event;
        if (event instanceof Map<?, ?> m) {
            Object type = m.get("type");
            return type != null ? type.toString() : event.toString();
        }
        return event.toString();
    }

    /**
     * Returns the set of event keys enabled from the given state (state-specific on merged with root on).
     */
    public Set<String> getEnabledEvents(String currentState) {
        StateNodeConfig stateConfig = states.get(currentState);
        Set<String> stateEvents = stateConfig != null ? stateConfig.getOn().keySet() : Set.of();
        Set<String> rootEvents = rootOn != null ? rootOn.keySet() : Set.of();
        return java.util.stream.Stream.concat(stateEvents.stream(), rootEvents.stream())
            .collect(java.util.stream.Collectors.toSet());
    }
}
