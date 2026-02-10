package com.logview.causality;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.*;

class ObservingCausalityTreeTest {

    private static CausalityNode<Integer> node(String value, int ctx, Object event, CausalityNode<Integer> parent) {
        return new CausalityNode<>(value, ctx, event, Instant.now(), parent, null);
    }

    @Test
    void decoratorDelegatesAllOperations() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> plain = new CausalityTree<>(root);
        CausalityTreeMetrics metrics = new CausalityTreeMetrics();
        ObservingCausalityTree<Integer> observed = new ObservingCausalityTree<>(plain, null, metrics);

        assertSame(observed.getHead(), root);
        assertFalse(observed.canUndo());
        assertFalse(observed.canRedo());

        observed.write(node("cooking", 1, "START", root));
        assertEquals("cooking", observed.getHead().getStateValue());
        assertTrue(observed.canUndo());

        assertTrue(observed.undo());
        assertEquals("idle", observed.getHead().getStateValue());
        assertTrue(observed.canRedo());

        assertTrue(observed.redo());
        assertEquals("cooking", observed.getHead().getStateValue());

        observed.pause();
        assertTrue(observed.isPaused());
        assertTrue(observed.resume());
        assertFalse(observed.isPaused());

        observed.write(node("completed", 2, "DONE", observed.getHead()));
        assertTrue(observed.undoToRoot());
        assertEquals("idle", observed.getHead().getStateValue());

        observed.pause();
        observed.clearPaused();
        assertFalse(observed.isPaused());
    }

    @Test
    void metricsIncrementOnEachOperation() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> plain = new CausalityTree<>(root);
        CausalityTreeMetrics metrics = new CausalityTreeMetrics();
        ObservingCausalityTree<Integer> observed = new ObservingCausalityTree<>(plain, null, metrics);

        observed.write(node("a", 1, "E1", root));
        observed.write(node("b", 2, "E2", observed.getHead()));
        observed.write(node("c", 3, "E3", observed.getHead()));
        CausalityTreeMetrics.Snapshot s1 = metrics.snapshot();
        assertEquals(3, s1.writes());
        assertEquals(0, s1.undos());

        observed.undo();
        observed.undo();
        observed.redo();
        CausalityTreeMetrics.Snapshot s2 = metrics.snapshot();
        assertEquals(3, s2.writes());
        assertEquals(2, s2.undos());
        assertEquals(1, s2.redos());

        observed.undo();
        observed.undoToRoot(); // one more undo to reach root (delegate does 1 internal undo; we don't count those in getUndoCount)
        assertEquals(3, metrics.getUndoCount());
        assertEquals(1, metrics.getUndoToRootCount());

        observed.pause();
        observed.resume();
        observed.pause();
        observed.clearPaused();
        assertEquals(2, metrics.getPauseCount());
        assertEquals(1, metrics.getResumeCount());
        assertEquals(1, metrics.getClearPausedCount());
    }

    @Test
    void withMetricsFactoryCreatesDecoratorWithMetricsOnly() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> plain = new CausalityTree<>(root);
        ObservingCausalityTree<Integer> observed = ObservingCausalityTree.withMetrics(plain);

        observed.write(node("cooking", 1, "START", root));
        assertEquals(1, observed.getMetrics().getWriteCount());
        assertEquals("cooking", observed.getHead().getStateValue());
    }

    @Test
    void interpreterWithObservingTreeRecordsMetrics() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            java.util.Map.of(
                "idle", new StateNodeConfig(java.util.Map.of("GO", TransitionTarget.state("active"))),
                "active", new StateNodeConfig(java.util.Map.of("STOP", TransitionTarget.state("idle")))
            )
        );
        StateMachine<Integer> machine = StateMachine.create(config);
        CausalityNode<Integer> initialNode = new CausalityNode<>(
            machine.getInitial(),
            machine.getContext(),
            null,
            Instant.now(),
            null,
            null
        );
        CausalityTree<Integer> plain = new CausalityTree<>(initialNode);
        CausalityTreeMetrics metrics = new CausalityTreeMetrics();
        ObservingCausalityTree<Integer> observed = new ObservingCausalityTree<>(plain, null, metrics);

        Interpreter<Integer> interp = Interpreter.interpret(machine, observed);
        interp.send("GO");
        interp.send("STOP");
        interp.undo();
        interp.undo();

        assertEquals(2, metrics.getWriteCount());
        assertEquals(2, metrics.getUndoCount());
    }

    @Test
    void loggingDecoratorEmitsLogRecordsWhenFine() {
        CausalityNode<Integer> root = node("idle", 0, null, null);
        CausalityTree<Integer> plain = new CausalityTree<>(root);
        Logger logger = Logger.getLogger(ObservingCausalityTreeTest.class.getName());
        logger.setLevel(Level.FINE);
        final java.util.List<String> messages = new java.util.concurrent.CopyOnWriteArrayList<>();
        Handler capture = new Handler() {
            @Override
            public void publish(LogRecord record) {
                messages.add(record.getMessage());
            }
            @Override
            public void flush() {}
            @Override
            public void close() {}
        };
        logger.addHandler(capture);

        CausalityTreeMetrics metrics = new CausalityTreeMetrics();
        ObservingCausalityTree<Integer> observed = new ObservingCausalityTree<>(plain, logger, metrics);
        observed.write(node("cooking", 1, "START", root));
        observed.undo();

        logger.removeHandler(capture);
        assertFalse(messages.isEmpty());
        assertTrue(messages.stream().anyMatch(m -> m != null && m.contains("write")));
        assertTrue(messages.stream().anyMatch(m -> m != null && m.contains("undo")));
    }
}
