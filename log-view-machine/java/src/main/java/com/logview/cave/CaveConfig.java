package com.logview.cave;

/**
 * Cave configuration (name + spelunk).
 * Aligns with TypeScript CaveConfig interface.
 */
public class CaveConfig {
    private final String name;
    private final Spelunk spelunk;

    public CaveConfig(String name, Spelunk spelunk) {
        this.name = name;
        this.spelunk = spelunk;
    }

    public String getName() { return name; }
    public Spelunk getSpelunk() { return spelunk; }
}
