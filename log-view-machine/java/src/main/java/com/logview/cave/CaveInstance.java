package com.logview.cave;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Cave instance interface - same API surface as TypeScript CaveInstance.
 */
public interface CaveInstance {
    String getName();
    boolean isInitialized();
    CaveConfig getConfig();
    /** Returns Spelunk or CaveConfig for the given path. */
    Object getRoutedConfig(String path);
    RenderTarget getRenderTarget(String path);
    String getRenderKey();
    /** Subscribe to render-key updates; returns runnable to unsubscribe. */
    Runnable observeViewKey(java.util.function.Consumer<String> callback);
    Map<String, CaveInstance> getChildCaves();
    CompletableFuture<CaveInstance> initialize();
}
