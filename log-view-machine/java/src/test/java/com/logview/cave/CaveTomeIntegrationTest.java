package com.logview.cave;

import com.logview.tome.CreateTome;
import com.logview.tome.TomeConfig;
import com.logview.tome.TomeInstance;
import com.logview.tome.TomeMachineConfig;
import com.logview.tome.ViewStateMachine;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration: Cave -> RenderTarget -> tomeId -> Tome registry -> TomeInstance -> getMachine -> send -> snapshot.
 */
class CaveTomeIntegrationTest {

    private static TomeConfig fishBurgerTomeConfig() {
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
            null,
            xstateConfig,
            0,
            null,
            null
        );
        return new TomeConfig(
            "fish-burger-tome",
            "Fish Burger Tome",
            null,
            null,
            null,
            Map.of("fishBurger", machineConfig),
            null,
            null
        );
    }

    @Test
    void caveGetRenderTargetResolveTomeGetMachineSendAssertSnapshot() {
        // Spelunk with route and tomeId
        Spelunk spelunk = Spelunk.builder()
            .route("/fish-burger")
            .container("main")
            .tomeId("fish-burger-tome")
            .build();

        CaveInstance cave = Cave.createCave("test-cave", spelunk);
        TomeInstance tome = CreateTome.createTome(fishBurgerTomeConfig());
        Map<String, TomeInstance> tomeRegistry = Map.of("fish-burger-tome", tome);

        RenderTarget target = cave.getRenderTarget(".");
        assertNotNull(target);
        assertEquals("fish-burger-tome", target.getTomeId());

        TomeInstance resolved = tomeRegistry.get(target.getTomeId());
        assertNotNull(resolved);
        ViewStateMachine machine = resolved.getMachine("fishBurger");
        assertNotNull(machine);

        assertEquals("idle", machine.getSnapshot().getValue());
        machine.send("START");
        assertEquals("cooking", machine.getSnapshot().getValue());
        machine.send("DONE");
        assertEquals("completed", machine.getSnapshot().getValue());
    }
}
