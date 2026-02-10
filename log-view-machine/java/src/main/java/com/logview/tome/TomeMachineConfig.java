package com.logview.tome;

import java.util.Map;

/**
 * Per-machine config within a Tome. Aligns with spec TomeMachineConfig and TS TomeMachineConfig.
 * xstateConfig can be a map (initial, states, context) used to build a causality MachineConfig.
 */
public final class TomeMachineConfig {

    private final String id;
    private final String name;
    private final String description;
    private final Map<String, Object> xstateConfig;
    private final Object context;
    private final String location;
    private final String remoteClient;

    public TomeMachineConfig(String id, String name, String description,
                             Map<String, Object> xstateConfig, Object context,
                             String location, String remoteClient) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.xstateConfig = xstateConfig;
        this.context = context;
        this.location = location;
        this.remoteClient = remoteClient;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Map<String, Object> getXstateConfig() { return xstateConfig; }
    public Object getContext() { return context; }
    public String getLocation() { return location; }
    public String getRemoteClient() { return remoteClient; }
}
