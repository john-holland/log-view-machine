package com.logview.causality;

/**
 * Operations for the causality tree (forward/past/redo/paused).
 * Enables decorators (e.g. logging, metrics) to wrap any implementation.
 */
public interface CausalityTreeOps<T> {

    CausalityNode<T> getHead();
    boolean canUndo();
    boolean canRedo();
    boolean isPaused();

    void write(CausalityNode<T> node);
    boolean undo();
    boolean redo();
    boolean undoToRoot();
    void pause();
    boolean resume();
    void clearPaused();
}
