package com.logview.causality;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Counters for causality tree operations. Thread-safe; safe to share with a decorator.
 */
public final class CausalityTreeMetrics {

    private final AtomicLong writeCount = new AtomicLong(0);
    private final AtomicLong undoCount = new AtomicLong(0);
    private final AtomicLong redoCount = new AtomicLong(0);
    private final AtomicLong undoToRootCount = new AtomicLong(0);
    private final AtomicLong pauseCount = new AtomicLong(0);
    private final AtomicLong resumeCount = new AtomicLong(0);
    private final AtomicLong clearPausedCount = new AtomicLong(0);

    public long getWriteCount() { return writeCount.get(); }
    public long getUndoCount() { return undoCount.get(); }
    public long getRedoCount() { return redoCount.get(); }
    public long getUndoToRootCount() { return undoToRootCount.get(); }
    public long getPauseCount() { return pauseCount.get(); }
    public long getResumeCount() { return resumeCount.get(); }
    public long getClearPausedCount() { return clearPausedCount.get(); }

    void incrementWrites() { writeCount.incrementAndGet(); }
    void incrementUndos() { undoCount.incrementAndGet(); }
    void incrementRedos() { redoCount.incrementAndGet(); }
    void incrementUndoToRoot() { undoToRootCount.incrementAndGet(); }
    void incrementPauses() { pauseCount.incrementAndGet(); }
    void incrementResumes() { resumeCount.incrementAndGet(); }
    void incrementClearPaused() { clearPausedCount.incrementAndGet(); }

    /** Immutable snapshot of current counts. */
    public Snapshot snapshot() {
        return new Snapshot(
            writeCount.get(),
            undoCount.get(),
            redoCount.get(),
            undoToRootCount.get(),
            pauseCount.get(),
            resumeCount.get(),
            clearPausedCount.get()
        );
    }

    public record Snapshot(
        long writes,
        long undos,
        long redos,
        long undoToRoots,
        long pauses,
        long resumes,
        long clearPaused
    ) {}
}
