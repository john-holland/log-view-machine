package com.logview.causality;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Decorator that adds logging and metrics to any CausalityTreeOps.
 * Delegates all operations to the wrapped tree and optionally logs and updates metrics.
 */
public final class ObservingCausalityTree<T> implements CausalityTreeOps<T> {

    private final CausalityTreeOps<T> delegate;
    private final Logger logger;
    private final CausalityTreeMetrics metrics;

    public ObservingCausalityTree(CausalityTreeOps<T> delegate, Logger logger, CausalityTreeMetrics metrics) {
        this.delegate = delegate;
        this.logger = logger;
        this.metrics = metrics != null ? metrics : new CausalityTreeMetrics();
    }

    /** Builder-style: decorator with metrics only (no logger). */
    public static <T> ObservingCausalityTree<T> withMetrics(CausalityTreeOps<T> delegate) {
        return new ObservingCausalityTree<>(delegate, null, new CausalityTreeMetrics());
    }

    /** Builder-style: decorator with logger and metrics. */
    public static <T> ObservingCausalityTree<T> withLoggingAndMetrics(
            CausalityTreeOps<T> delegate,
            Logger logger,
            CausalityTreeMetrics metrics) {
        return new ObservingCausalityTree<>(delegate, logger, metrics != null ? metrics : new CausalityTreeMetrics());
    }

    @Override
    public CausalityNode<T> getHead() {
        return delegate.getHead();
    }

    @Override
    public boolean canUndo() {
        return delegate.canUndo();
    }

    @Override
    public boolean canRedo() {
        return delegate.canRedo();
    }

    @Override
    public boolean isPaused() {
        return delegate.isPaused();
    }

    @Override
    public void write(CausalityNode<T> node) {
        if (logger != null && logger.isLoggable(Level.FINE)) {
            logger.log(Level.FINE, "causality.write state={0} event={1}",
                new Object[]{ node.getStateValue(), node.getEvent() });
        }
        metrics.incrementWrites();
        delegate.write(node);
    }

    @Override
    public boolean undo() {
        boolean result = delegate.undo();
        if (result) {
            if (logger != null && logger.isLoggable(Level.FINE)) {
                logger.fine("causality.undo head=" + delegate.getHead().getStateValue());
            }
            metrics.incrementUndos();
        }
        return result;
    }

    @Override
    public boolean redo() {
        boolean result = delegate.redo();
        if (result) {
            if (logger != null && logger.isLoggable(Level.FINE)) {
                logger.fine("causality.redo head=" + delegate.getHead().getStateValue());
            }
            metrics.incrementRedos();
        }
        return result;
    }

    @Override
    public boolean undoToRoot() {
        boolean result = delegate.undoToRoot();
        if (result) {
            if (logger != null && logger.isLoggable(Level.FINE)) {
                logger.fine("causality.undoToRoot head=" + delegate.getHead().getStateValue());
            }
            metrics.incrementUndoToRoot();
        }
        return result;
    }

    @Override
    public void pause() {
        if (logger != null && logger.isLoggable(Level.FINE)) {
            logger.fine("causality.pause");
        }
        metrics.incrementPauses();
        delegate.pause();
    }

    @Override
    public boolean resume() {
        boolean result = delegate.resume();
        if (result) {
            if (logger != null && logger.isLoggable(Level.FINE)) {
                logger.fine("causality.resume head=" + delegate.getHead().getStateValue());
            }
            metrics.incrementResumes();
        }
        return result;
    }

    @Override
    public void clearPaused() {
        if (logger != null && logger.isLoggable(Level.FINE)) {
            logger.fine("causality.clearPaused");
        }
        metrics.incrementClearPaused();
        delegate.clearPaused();
    }

    public CausalityTreeMetrics getMetrics() {
        return metrics;
    }
}
