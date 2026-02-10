package com.logview.tome;

import com.logview.causality.Interpreter;
import com.logview.causality.MachineConfig;
import com.logview.causality.StateMachine;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * Default TomeInstance: builds machines from TomeConfig and holds them by config key.
 */
public final class DefaultTomeInstance implements TomeInstance {

    private final TomeConfig config;
    private final Map<String, ViewStateMachine> machines = new HashMap<>();
    private final CopyOnWriteArrayList<Consumer<String>> viewKeyListeners = new CopyOnWriteArrayList<>();
    private volatile boolean caveSynchronized;

    public DefaultTomeInstance(TomeConfig config) {
        this.config = config;
        Object tomeContext = config.getContext();
        for (Map.Entry<String, TomeMachineConfig> e : config.getMachines().entrySet()) {
            String key = e.getKey();
            TomeMachineConfig mc = e.getValue();
            Object mergeContext = mc.getContext() != null ? mc.getContext() : tomeContext;
            MachineConfig<Object> machineConfig = XStateConfigAdapter.toMachineConfig(
                mc.getId(), mc.getXstateConfig(), mergeContext);
            StateMachine<Object> sm = StateMachine.create(machineConfig);
            Interpreter<Object> interp = Interpreter.interpret(sm);
            String renderKey = mc.getId() != null ? mc.getId() : key;
            machines.put(key, new DefaultViewStateMachine(interp, renderKey));
            // Also allow lookup by machine id (e.g. "fishBurger" vs "orderMachine")
            if (mc.getId() != null && !machines.containsKey(mc.getId())) {
                machines.put(mc.getId(), machines.get(key));
            }
        }
    }

    @Override
    public String getId() {
        return config.getId();
    }

    @Override
    public TomeConfig getConfig() {
        return config;
    }

    @Override
    public ViewStateMachine getMachine(String id) {
        return machines.get(id);
    }

    @Override
    public String getRenderKey() {
        String base = config.getRenderKey() != null ? config.getRenderKey() : config.getId();
        if (machines.isEmpty()) return base;
        return base + ":" + String.join(",", machines.keySet());
    }

    @Override
    public Runnable observeViewKey(Consumer<String> callback) {
        callback.accept(getRenderKey());
        viewKeyListeners.add(callback);
        return () -> viewKeyListeners.remove(callback);
    }

    @Override
    public void start() {
        // Machines are already started (Interpreter.interpret() starts them). No-op unless we add lifecycle.
    }

    @Override
    public void stop() {
        // Optional: stop interpreters. No-op for now.
    }

    @Override
    public boolean isCaveSynchronized() {
        return caveSynchronized;
    }

    @Override
    public void synchronizeWithCave() {
        caveSynchronized = true;
    }
}
