package com.logview.cave;

import java.util.Map;

/**
 * Spelunk: descent structure for a cave (nested caves, tomes, route, container, etc.).
 * Aligns with TypeScript Spelunk type.
 */
public class Spelunk {
    private final Map<String, Spelunk> childCaves;
    private final Map<String, Object> tomes;
    private final String route;
    private final String container;
    private final String renderKey;
    private final String tomeId;
    private final Map<String, Object> docker;
    private final Map<String, Object> subdomains;

    public Spelunk(
            Map<String, Spelunk> childCaves,
            Map<String, Object> tomes,
            String route,
            String container,
            String renderKey,
            String tomeId,
            Map<String, Object> docker,
            Map<String, Object> subdomains) {
        this.childCaves = childCaves;
        this.tomes = tomes;
        this.route = route;
        this.container = container;
        this.renderKey = renderKey;
        this.tomeId = tomeId;
        this.docker = docker;
        this.subdomains = subdomains;
    }

    public Map<String, Spelunk> getChildCaves() { return childCaves; }
    public Map<String, Object> getTomes() { return tomes; }
    public String getRoute() { return route; }
    public String getContainer() { return container; }
    public String getRenderKey() { return renderKey; }
    public String getTomeId() { return tomeId; }
    public Map<String, Object> getDocker() { return docker; }
    public Map<String, Object> getSubdomains() { return subdomains; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Map<String, Spelunk> childCaves;
        private Map<String, Object> tomes;
        private String route;
        private String container;
        private String renderKey;
        private String tomeId;
        private Map<String, Object> docker;
        private Map<String, Object> subdomains;

        public Builder childCaves(Map<String, Spelunk> childCaves) { this.childCaves = childCaves; return this; }
        public Builder tomes(Map<String, Object> tomes) { this.tomes = tomes; return this; }
        public Builder route(String route) { this.route = route; return this; }
        public Builder container(String container) { this.container = container; return this; }
        public Builder renderKey(String renderKey) { this.renderKey = renderKey; return this; }
        public Builder tomeId(String tomeId) { this.tomeId = tomeId; return this; }
        public Builder docker(Map<String, Object> docker) { this.docker = docker; return this; }
        public Builder subdomains(Map<String, Object> subdomains) { this.subdomains = subdomains; return this; }
        public Spelunk build() {
            return new Spelunk(childCaves, tomes, route, container, renderKey, tomeId, docker, subdomains);
        }
    }
}
