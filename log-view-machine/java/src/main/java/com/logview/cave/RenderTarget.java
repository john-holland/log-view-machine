package com.logview.cave;

import java.util.Map;

/**
 * Return type of getRenderTarget(path): route, container, tomes, and optional tomeId.
 * Aligns with TypeScript RenderTarget interface.
 */
public class RenderTarget {
    private final String route;
    private final String container;
    private final Map<String, Object> tomes;
    private final String tomeId;

    public RenderTarget(String route, String container, Map<String, Object> tomes, String tomeId) {
        this.route = route;
        this.container = container;
        this.tomes = tomes;
        this.tomeId = tomeId;
    }

    public String getRoute() { return route; }
    public String getContainer() { return container; }
    public Map<String, Object> getTomes() { return tomes; }
    public String getTomeId() { return tomeId; }
}
