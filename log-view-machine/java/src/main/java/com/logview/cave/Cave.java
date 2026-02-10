package com.logview.cave;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

/**
 * Cave factory and default implementation.
 * (name, caveDescent) -> CaveInstance. Aligns with TypeScript Cave.ts.
 */
public final class Cave {

    private static final Pattern PATH_TRIM = Pattern.compile("^\\./?|/$");

    public static CaveInstance createCave(String name, Spelunk spelunk) {
        return new DefaultCave(name, spelunk);
    }

    /** Alias for createCave for API parity with TypeScript. */
    public static CaveInstance cave(String name, Spelunk spelunk) {
        return createCave(name, spelunk);
    }

    private static class DefaultCave implements CaveInstance {
        private final String caveName;
        private final Spelunk spelunk;
        private final CaveConfig config;
        private final Map<String, CaveInstance> childCavesMap;
        private final CopyOnWriteArrayList<java.util.function.Consumer<String>> viewKeyListeners = new CopyOnWriteArrayList<>();
        private volatile boolean initialized = false;

        DefaultCave(String name, Spelunk s) {
            this.caveName = name;
            this.spelunk = s;
            this.config = new CaveConfig(name, s);
            this.childCavesMap = buildChildCaves(s);
        }

        @Override
        public String getName() { return caveName; }

        @Override
        public boolean isInitialized() { return initialized; }

        @Override
        public CaveConfig getConfig() { return config; }

        @Override
        public Object getRoutedConfig(String path) {
            String trimmed = PATH_TRIM.matcher(path).replaceAll("").trim();
            if (trimmed.isEmpty()) trimmed = ".";
            if (".".equals(trimmed)) return config;
            Spelunk current = spelunk;
            for (String part : trimmed.split("/")) {
                if (part.isEmpty()) continue;
                Map<String, Spelunk> children = current.getChildCaves();
                if (children == null) return config;
                Spelunk next = children.get(part);
                if (next == null) return config;
                current = next;
            }
            return current;
        }

        @Override
        public RenderTarget getRenderTarget(String path) {
            Object routed = getRoutedConfig(path);
            Spelunk s;
            if (routed instanceof CaveConfig) {
                s = ((CaveConfig) routed).getSpelunk();
            } else if (routed instanceof Spelunk) {
                s = (Spelunk) routed;
            } else {
                s = spelunk;
            }
            return new RenderTarget(s.getRoute(), s.getContainer(), s.getTomes(), s.getTomeId());
        }

        @Override
        public String getRenderKey() {
            String rk = spelunk.getRenderKey();
            return rk != null ? rk : caveName;
        }

        @Override
        public Runnable observeViewKey(java.util.function.Consumer<String> callback) {
            callback.accept(getRenderKey());
            viewKeyListeners.add(callback);
            return () -> viewKeyListeners.remove(callback);
        }

        @Override
        public Map<String, CaveInstance> getChildCaves() { return Collections.unmodifiableMap(childCavesMap); }

        @Override
        public CompletableFuture<CaveInstance> initialize() {
            if (initialized) return CompletableFuture.completedFuture(this);
            for (CaveInstance child : childCavesMap.values()) {
                child.initialize().join();
            }
            initialized = true;
            return CompletableFuture.completedFuture(this);
        }

        private static Map<String, CaveInstance> buildChildCaves(Spelunk s) {
            Map<String, Spelunk> children = s.getChildCaves();
            if (children == null || children.isEmpty()) return Collections.emptyMap();
            Map<String, CaveInstance> out = new HashMap<>();
            children.forEach((key, childSpelunk) -> out.put(key, createCave(key, childSpelunk)));
            return out;
        }
    }
}
