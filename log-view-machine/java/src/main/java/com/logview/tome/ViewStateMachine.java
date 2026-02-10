package com.logview.tome;

import com.logview.causality.StateSnapshot;

import java.util.function.BiConsumer;
import java.util.function.Consumer;

/**
 * Facade over causality Interpreter that adds getRenderKey() and observeViewKey().
 * Returned by TomeInstance.getMachine(id); congruent with TS ViewStateMachine API.
 */
public interface ViewStateMachine {

    /** Current snapshot (value, context, event). */
    StateSnapshot<?> getSnapshot();

    /** Send event (string or map with "type"). */
    void send(Object event);

    /** Send event with context assign (context, event) -> newContext. */
    void send(Object event, java.util.function.BiFunction<Object, Object, Object> assign);

    /** Undo one step. */
    boolean undo();

    /** Redo one step. */
    boolean redo();

    /** Stable key for this machine in the render tree. */
    String getRenderKey();

    /** Subscribe to render-key updates; returns runnable to unsubscribe. */
    Runnable observeViewKey(Consumer<String> callback);
}
