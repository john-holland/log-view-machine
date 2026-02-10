package com.logview.causality;

import java.util.Objects;
import java.util.function.Predicate;

/**
 * Immutable snapshot of current state (XState-congruent).
 */
public final class StateSnapshot<T> {

    private final String value;
    private final T context;
    private final Object event;
    private final boolean done;
    private final Object historyValue;

    public StateSnapshot(String value, T context, Object event, boolean done, Object historyValue) {
        this.value = value;
        this.context = context;
        this.event = event;
        this.done = done;
        this.historyValue = historyValue;
    }

    public StateSnapshot(String value, T context, Object event) {
        this(value, context, event, false, null);
    }

    public String getValue() { return value; }
    public T getContext() { return context; }
    public Object getEvent() { return event; }
    public boolean isDone() { return done; }
    public Object getHistoryValue() { return historyValue; }

    /** Predicate: state value equals the given string. */
    public Predicate<String> matches() {
        return s -> Objects.equals(value, s);
    }

    public boolean matches(String state) {
        return Objects.equals(value, state);
    }
}
