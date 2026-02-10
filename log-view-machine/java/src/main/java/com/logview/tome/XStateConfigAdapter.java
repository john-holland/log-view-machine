package com.logview.tome;

import com.logview.causality.MachineConfig;
import com.logview.causality.StateNodeConfig;
import com.logview.causality.TransitionTarget;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Builds a causality MachineConfig from an xstateConfig-style map (initial, states, context).
 * States format: stateName -> { "on" -> { eventName -> targetStateString } }.
 */
public final class XStateConfigAdapter {

    private XStateConfigAdapter() {}

    @SuppressWarnings("unchecked")
    public static MachineConfig<Object> toMachineConfig(String machineId, Map<String, Object> xstateConfig, Object mergeContext) {
        if (xstateConfig == null) {
            throw new IllegalArgumentException("xstateConfig is required");
        }
        String initial = (String) xstateConfig.get("initial");
        if (initial == null) initial = "idle";
        Object ctx = xstateConfig.get("context");
        if (ctx == null) ctx = mergeContext != null ? mergeContext : 0;

        Map<String, StateNodeConfig> states = new HashMap<>();
        Object statesObj = xstateConfig.get("states");
        if (statesObj instanceof Map) {
            Map<String, Object> statesMap = (Map<String, Object>) statesObj;
            for (Map.Entry<String, Object> e : statesMap.entrySet()) {
                String stateName = e.getKey();
                Object stateDef = e.getValue();
                Map<String, TransitionTarget> on = new HashMap<>();
                if (stateDef instanceof Map) {
                    Object onObj = ((Map<?, ?>) stateDef).get("on");
                    if (onObj instanceof Map) {
                        for (Map.Entry<?, ?> ev : ((Map<?, ?>) onObj).entrySet()) {
                            String eventKey = ev.getKey().toString();
                            Object target = ev.getValue();
                            String targetState = target instanceof String ? (String) target : String.valueOf(target);
                            on.put(eventKey, TransitionTarget.state(targetState));
                        }
                    }
                }
                states.put(stateName, new StateNodeConfig(on));
            }
        }

        return new MachineConfig<>(machineId, initial, ctx, states, null);
    }
}
