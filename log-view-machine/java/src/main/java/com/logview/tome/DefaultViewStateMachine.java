package com.logview.tome;

import com.logview.causality.Interpreter;
import com.logview.causality.StateMachine;
import com.logview.causality.StateSnapshot;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.BiFunction;
import java.util.function.Consumer;

/**
 * ViewStateMachine facade wrapping a causality Interpreter with getRenderKey and observeViewKey.
 */
public final class DefaultViewStateMachine implements ViewStateMachine {

    private final Interpreter<Object> interpreter;
    private final String renderKey;
    private final List<Consumer<String>> viewKeyListeners = new CopyOnWriteArrayList<>();

    public DefaultViewStateMachine(Interpreter<Object> interpreter, String renderKey) {
        this.interpreter = interpreter;
        this.renderKey = renderKey != null ? renderKey : "machine";
    }

    @Override
    public StateSnapshot<?> getSnapshot() {
        return interpreter.getSnapshot();
    }

    @Override
    public void send(Object event) {
        interpreter.send(event);
        notifyViewKey();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void send(Object event, BiFunction<Object, Object, Object> assign) {
        interpreter.send(event, (BiFunction<Object, Object, Object>) assign);
        notifyViewKey();
    }

    @Override
    public boolean undo() {
        boolean r = interpreter.undo();
        if (r) notifyViewKey();
        return r;
    }

    @Override
    public boolean redo() {
        boolean r = interpreter.redo();
        if (r) notifyViewKey();
        return r;
    }

    @Override
    public String getRenderKey() {
        return renderKey;
    }

    @Override
    public Runnable observeViewKey(Consumer<String> callback) {
        callback.accept(renderKey);
        viewKeyListeners.add(callback);
        return () -> viewKeyListeners.remove(callback);
    }

    private void notifyViewKey() {
        String key = getRenderKey();
        for (Consumer<String> l : viewKeyListeners) {
            l.accept(key);
        }
    }
}
