package com.logview.causality;

import java.time.Instant;
import java.util.Objects;

/**
 * A single node in the 4D causality tree.
 * Holds state value, context, event, and timestamp (the four dimensions);
 * parent link for the forward chain.
 */
public final class CausalityNode<T> {

    private final String stateValue;
    private final T context;
    private final Object event;
    private final Instant timestamp;
    private final CausalityNode<T> parent;
    private final String id;

    public CausalityNode(String stateValue, T context, Object event, Instant timestamp, CausalityNode<T> parent, String id) {
        this.stateValue = stateValue;
        this.context = context;
        this.event = event;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.parent = parent;
        this.id = id;
    }

    public CausalityNode(String stateValue, T context, Object event, Instant timestamp, CausalityNode<T> parent) {
        this(stateValue, context, event, timestamp, parent, null);
    }

    public String getStateValue() { return stateValue; }
    public T getContext() { return context; }
    public Object getEvent() { return event; }
    public Instant getTimestamp() { return timestamp; }
    public CausalityNode<T> getParent() { return parent; }
    public String getId() { return id; }

    public CausalityNode<T> withId(String id) {
        return new CausalityNode<>(stateValue, context, event, timestamp, parent, id);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CausalityNode<?> that = (CausalityNode<?>) o;
        return Objects.equals(stateValue, that.stateValue)
            && Objects.equals(context, that.context)
            && Objects.equals(event, that.event)
            && Objects.equals(timestamp, that.timestamp)
            && Objects.equals(parent, that.parent)
            && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(stateValue, context, event, timestamp, parent, id);
    }
}
