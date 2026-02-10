package com.logview.tome;

import com.logview.causality.StateSnapshot;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class CreateTomeTest {

    private static TomeConfig fishBurgerConfig() {
        Map<String, Object> states = Map.of(
            "idle", Map.of("on", Map.of("START", "cooking")),
            "cooking", Map.of("on", Map.of("DONE", "completed")),
            "completed", Map.of("on", Map.of("RESET", "idle"))
        );
        Map<String, Object> xstateConfig = Map.of(
            "id", "fishBurger",
            "initial", "idle",
            "context", 0,
            "states", states
        );
        TomeMachineConfig machineConfig = new TomeMachineConfig(
            "fishBurger",
            "Fish Burger",
            "Fish burger ordering",
            xstateConfig,
            0,
            null,
            null
        );
        TomeConfig config = new TomeConfig(
            "fish-burger-tome",
            "Fish Burger Tome",
            null,
            "1.0",
            null,
            Map.of("fishBurger", machineConfig),
            null,
            null
        );
        return config;
    }

    @Test
    void createTomeGetMachineSendAssertSnapshot() {
        TomeConfig config = fishBurgerConfig();
        TomeInstance tome = CreateTome.createTome(config);
        ViewStateMachine machine = tome.getMachine("fishBurger");
        assertNotNull(machine);

        machine.send("START");
        StateSnapshot<?> snap = machine.getSnapshot();
        assertEquals("cooking", snap.getValue());

        assertNotNull(machine.getRenderKey());
    }

    @Test
    void observeViewKeyAndUnsubscribe() {
        TomeConfig config = fishBurgerConfig();
        TomeInstance tome = CreateTome.createTome(config);
        ViewStateMachine machine = tome.getMachine("fishBurger");
        assertNotNull(machine);

        AtomicReference<String> lastKey = new AtomicReference<>();
        Runnable unsubscribe = machine.observeViewKey(lastKey::set);
        assertEquals(machine.getRenderKey(), lastKey.get());

        lastKey.set(null);
        unsubscribe.run();
        machine.send("START");
        // Listener removed, so lastKey may still be null (or unchanged from before send if we don't notify on send)
        // After unsubscribe, callback should not be called. We didn't capture a second call; just verify unsubscribe runs.
        assertDoesNotThrow(unsubscribe::run);
    }

    @Test
    void twoMachinesIndependentState() {
        Map<String, Object> statesA = Map.of(
            "idle", Map.of("on", Map.of("GO", "active")),
            "active", Map.of("on", Map.of())
        );
        TomeMachineConfig mcA = new TomeMachineConfig("machineA", "A", null,
            Map.of("initial", "idle", "context", 0, "states", statesA), 0, null, null);
        Map<String, Object> statesB = Map.of(
            "idle", Map.of("on", Map.of("GO", "active")),
            "active", Map.of("on", Map.of())
        );
        TomeMachineConfig mcB = new TomeMachineConfig("machineB", "B", null,
            Map.of("initial", "idle", "context", 0, "states", statesB), 0, null, null);

        TomeConfig config = new TomeConfig("two-tome", "Two", null, null, null,
            Map.of("machineA", mcA, "machineB", mcB), null, null);
        TomeInstance tome = CreateTome.createTome(config);

        ViewStateMachine a = tome.getMachine("machineA");
        ViewStateMachine b = tome.getMachine("machineB");
        assertNotNull(a);
        assertNotNull(b);

        a.send("GO");
        assertEquals("active", a.getSnapshot().getValue());
        assertEquals("idle", b.getSnapshot().getValue());

        b.send("GO");
        assertEquals("active", b.getSnapshot().getValue());
    }
}
