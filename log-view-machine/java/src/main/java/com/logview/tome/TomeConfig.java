package com.logview.tome;

import java.util.Map;

/**
 * Tome configuration: id, name, machines, optional routing/context.
 * Aligns with spec TomeConfig and TS TomeConfig (server-agnostic parts).
 */
public final class TomeConfig {

    private final String id;
    private final String name;
    private final String description;
    private final String version;
    private final String renderKey;
    private final Map<String, TomeMachineConfig> machines;
    private final Object routing;
    private final Object context;

    public TomeConfig(String id, String name, String description, String version,
                      String renderKey, Map<String, TomeMachineConfig> machines,
                      Object routing, Object context) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.version = version;
        this.renderKey = renderKey;
        this.machines = machines != null ? Map.copyOf(machines) : Map.of();
        this.routing = routing;
        this.context = context;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getVersion() { return version; }
    public String getRenderKey() { return renderKey; }
    public Map<String, TomeMachineConfig> getMachines() { return machines; }
    public Object getRouting() { return routing; }
    public Object getContext() { return context; }
}
