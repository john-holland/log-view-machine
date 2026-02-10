package com.logview.causality;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class UndoRedoIntegrationTest {

    @Test
    void idleToCookingToCompletedThenUndoTwiceRedoOnce() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("START", TransitionTarget.state("cooking"))),
                "cooking", new StateNodeConfig(Map.of("DONE", TransitionTarget.state("completed"))),
                "completed", new StateNodeConfig(Map.of("RESET", TransitionTarget.state("idle")))
            )
        );
        Interpreter<Integer> service = Interpreter.interpret(StateMachine.create(config));

        service.send("START");
        assertEquals("cooking", service.getValue());
        service.send("DONE");
        assertEquals("completed", service.getValue());

        assertTrue(service.undo());
        assertEquals("cooking", service.getValue());
        assertTrue(service.undo());
        assertEquals("idle", service.getValue());

        assertTrue(service.redo());
        assertEquals("cooking", service.getValue());
        assertTrue(service.canRedo()); // one more redo (to completed) available
        assertTrue(service.redo());
        assertEquals("completed", service.getValue());
        assertFalse(service.canRedo());
    }

    @Test
    void sendAfterUndoClearsRedo() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("GO", TransitionTarget.state("active"))),
                "active", new StateNodeConfig(Map.of("BACK", TransitionTarget.state("idle")))
            )
        );
        Interpreter<Integer> service = Interpreter.interpret(StateMachine.create(config));

        service.send("GO");
        assertEquals("active", service.getValue());
        service.undo();
        assertEquals("idle", service.getValue());
        assertTrue(service.canRedo());

        service.send("GO");
        assertFalse(service.canRedo());
        assertEquals("active", service.getValue());
    }

    @Test
    void setStateOverrideWritesNodeWithOverrideEventAndUndoToRootReturnsToInitial() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("START", TransitionTarget.state("cooking"))),
                "cooking", new StateNodeConfig(Map.of("DONE", TransitionTarget.state("completed"))),
                "completed", new StateNodeConfig(Map.of("RESET", TransitionTarget.state("idle")))
            )
        );
        Interpreter<Integer> service = Interpreter.interpret(StateMachine.create(config));
        assertEquals("idle", service.getValue());

        service.setState("completed", 99);
        StateSnapshot<Integer> snap = service.getSnapshot();
        assertEquals("completed", snap.getValue());
        assertEquals(99, snap.getContext());
        assertEquals(MachineConfig.OVERRIDE_EVENT, snap.getEvent());

        service.undoToRoot();
        assertEquals("idle", service.getValue());
        assertEquals(0, service.getContext());
    }

    @Test
    void backwardIsAliasForUndoToRoot() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("GO", TransitionTarget.state("active")))
            )
        );
        Interpreter<Integer> service = Interpreter.interpret(StateMachine.create(config));
        service.send("GO");
        assertEquals("active", service.getValue());
        assertTrue(service.backward());
        assertEquals("idle", service.getValue());
        assertFalse(service.backward());
    }
}
