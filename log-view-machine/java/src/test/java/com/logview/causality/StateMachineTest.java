package com.logview.causality;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class StateMachineTest {

    @Test
    void createMachineAndInterpretReturnServiceWithInitialState() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("GO", TransitionTarget.state("active"))),
                "active", new StateNodeConfig(Map.of("STOP", TransitionTarget.state("idle")))
            )
        );
        StateMachine<Integer> machine = StateMachine.create(config);
        Interpreter<Integer> service = Interpreter.interpret(machine);

        assertEquals("idle", service.getSnapshot().getValue());
        assertEquals(0, service.getSnapshot().getContext());
        assertEquals("idle", service.getValue());
    }

    @Test
    void sendTransitionsStateAndUpdatesSnapshot() {
        MachineConfig<Integer> config = new MachineConfig<>(
            "idle",
            0,
            Map.of(
                "idle", new StateNodeConfig(Map.of("GO", TransitionTarget.state("active"))),
                "active", new StateNodeConfig(Map.of("STOP", TransitionTarget.state("idle")))
            )
        );
        Interpreter<Integer> service = Interpreter.interpret(StateMachine.create(config));

        service.send("GO");
        assertEquals("active", service.getSnapshot().getValue());

        service.send("STOP");
        assertEquals("idle", service.getSnapshot().getValue());
    }

    @Test
    void sendWithAssignUpdatesContext() {
        record Ctx(int count) {}
        MachineConfig<Ctx> config = new MachineConfig<>(
            "idle",
            new Ctx(0),
            Map.of(
                "idle", new StateNodeConfig(Map.of("INC", TransitionTarget.state("idle")))
            )
        );
        Interpreter<Ctx> service = Interpreter.interpret(StateMachine.create(config));
        service.send("INC", (ctx, e) -> new Ctx(ctx.count + 1));
        assertEquals(1, service.getSnapshot().getContext().count());
    }

    @Test
    void unknownEventDoesNotTransition() {
        MachineConfig<Void> config = new MachineConfig<>(
            "idle",
            null,
            Map.of(
                "idle", new StateNodeConfig(Map.of("GO", TransitionTarget.state("active"))),
                "active", new StateNodeConfig(Map.of())
            )
        );
        Interpreter<Void> service = Interpreter.interpret(StateMachine.create(config));
        service.send("UNKNOWN");
        assertEquals("idle", service.getSnapshot().getValue());
    }
}
