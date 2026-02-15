# Cave services and appShell registry

This document describes how *-caveservice-adapters extend the Cave server with named app shells (e.g. Python apps) and how to use the appShell registry.

---

## Overview

- **createCaveServer** builds a shared **CaveServerContext** and calls each plugin’s **apply(context)**. The context includes an optional **appShellRegistryRef**: a mutable ref to an **AppShellRegistry**.
- The registry is a map of **name → AppShellDescriptor**. Any adapter can register or look up descriptors via **context.appShellRegistryRef.current**.
- **CaveServiceAdapter** is a convention: an adapter that implements **CaveServerAdapter** and uses **appShellRegistryRef** in **apply()** to register or consume app shells. No separate interface; the contract is “use appShellRegistryRef in apply()”.

---

## AppShell registry

- **Where it lives:** **context.appShellRegistryRef** is set by **createCaveServer** (so all plugins see the same registry). Type: **{ current: AppShellRegistry }**.
- **AppShellRegistry** interface:
  - **register(name: string, descriptor: AppShellDescriptor): void**
  - **get(name: string): AppShellDescriptor | undefined**
- **AppShellDescriptor** (per app shell):
  - **name**, **scriptPath** (required)
  - **cwd?**, **env?**, **pythonPath?**, **requirementsPath?**, **dependencies?** (string[]), **pipInstall?** (boolean | 'always' | 'once'), **venvPath?**
- Run behavior (e.g. spawn process, pip install) is implemented by the adapter that registers the descriptor (e.g. **pythonapp-caveservice-adapter**), not by the core registry.

---

## CaveServiceAdapter convention

Adapters that add app shells to the Cave server should:

1. Implement **CaveServerAdapter** and **apply(context: CaveServerContext)**.
2. If **context.appShellRegistryRef** is present, register descriptors with **context.appShellRegistryRef.current.register(name, descriptor)** (and perform any one-time or lazy setup, e.g. venv, pip install).
3. Rely on plugin order in **createCaveServer({ plugins: [...] })** for initialization order; adapters that consume the registry (e.g. to run by name) should run after adapters that register.

No extra interface is required; “CaveServiceAdapter” is the documented role for packages like **pythonapp-caveservice-adapter**.

---

## sections.appShell (optional)

**CreateCaveServerConfig.sections** can include **appShell: true** so adapters can gate appShell-related behavior (e.g. routes or startup steps) without changing adapter code. When **sections.appShell === true**, *-caveservice-adapters may enable shelling routes or install steps; when false or omitted, they may no-op or skip those features.

---

## Usage example

```ts
await createCaveServer({
  cave,
  tomeConfigs,
  sections: { registry: true, appShell: true },
  plugins: [
    expressCaveAdapter({ ... }),
    createPythonAppCaveServiceAdapter({
      apps: {
        myTool: {
          scriptPath: join(__dirname, 'scripts/my_tool.py'),
          cwd: join(__dirname, 'scripts'),
          requirementsPath: 'requirements.txt',
          pipInstall: 'once',
        },
      },
    }),
  ],
});

// Later: get the adapter handle and run by name (if the adapter exposes runAppShell).
// Or read from context.appShellRegistryRef.current.get('myTool') for descriptor only.
```

---

## Related

- **log-view-machine** exports **AppShellDescriptor**, **AppShellRegistry**, and **CaveServerContext** (with **appShellRegistryRef**).
- **pythonapp-caveservice-adapter** implements a concrete CaveServiceAdapter: registers Python app descriptors, runs pip install (Option A: from Node), and exposes **runAppShell(name, args?)** / **getAppShell(name)**.
