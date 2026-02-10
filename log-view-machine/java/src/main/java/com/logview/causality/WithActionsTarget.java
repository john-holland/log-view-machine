package com.logview.causality;

import java.util.List;

/**
 * Transition with target state and optional actions.
 */
public record WithActionsTarget(String target, List<String> actions) implements TransitionTarget {

    @Override
    public String getTarget() {
        return target;
    }
}
