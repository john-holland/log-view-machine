package com.logview.causality;

/**
 * Simple transition: event -> state only.
 */
public record StateTarget(String target) implements TransitionTarget {

    @Override
    public String getTarget() {
        return target;
    }
}
