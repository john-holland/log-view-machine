package com.logview.causality;

/**
 * Event -> target state (string) or full transition config.
 * Sealed-style: State (target only) or WithActions (target + actions).
 */
public sealed interface TransitionTarget permits StateTarget, WithActionsTarget {

    String getTarget();

    static TransitionTarget state(String target) {
        return new StateTarget(target);
    }

    static TransitionTarget withActions(String target, java.util.List<String> actions) {
        return new WithActionsTarget(target, actions);
    }
}
