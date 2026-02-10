package com.logview.tome;

import java.util.function.Consumer;

/**
 * Runtime Tome: holds machines by id, getRenderKey, observeViewKey, start/stop.
 * Aligns with TS TomeInstance. Cave resolves TomeInstance by tomeId from RenderTarget.
 */
public interface TomeInstance {

    String getId();
    TomeConfig getConfig();

    /**
     * Returns a machine handle (ViewStateMachine) for the given machine id.
     * Id is the key in config.machines (e.g. "fishBurger") or the machine's config id.
     */
    ViewStateMachine getMachine(String id);

    String getRenderKey();
    Runnable observeViewKey(Consumer<String> callback);

    void start();
    void stop();

    /** True when this Tome has been synchronized with a Cave. */
    boolean isCaveSynchronized();
    void synchronizeWithCave();
}
