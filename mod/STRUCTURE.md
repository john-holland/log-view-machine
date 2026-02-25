# Mod Directory Structure

This document describes the dotCMS-aligned mod directory convention used in this project.

## Overview

- **mod.json** is the canonical mod manifest (source of truth).
- **assets/** contains static assets (templates, styles, scripts) with paths matching `assets.templates`, `assets.styles`, `assets.scripts` in mod.json.
- **content/** holds dotCMS-compatible exports (e.g. `mod-definition.json`) for import/upload.
- **schema/** (at `mod/schema/`) provides JSON Schema for validating mod.json.

## Directory Layout

```
mod/
  examples/
    fish-burger-mod/
      mod.json           # Mod manifest (source of truth)
      package.json
      assets/
        templates/
        styles/
        scripts/
      content/           # dotCMS-compatible exports
        mod-definition.json
  schema/
    mod.schema.json      # JSON Schema for mod.json
```

## mod.json

The mod manifest must include:

- **id** (required): Unique mod identifier
- **name** (required): Human-readable mod name
- **description** (required): Mod description
- **version** (required): Semantic version (e.g. `1.0.0`)
- **serverUrl** (required): Base URL of the mod server
- **assets** (required): Object mapping asset keys to paths (e.g. `templates`, `styles`, `scripts`)
- **entryPoints** (optional): Named entry point routes
- **modMetadata** (optional): `pathReplacements`, `assetLinks`, `spelunkMap` for LVM integration

Validate mod.json against `mod/schema/mod.schema.json`.

## content/mod-definition.json

A dotCMS-compatible structure (e.g. Cavemod or ModDefinition content type) derived from mod.json. Used for:

- Uploading mod metadata to dotCMS via content API
- Syncing mod definitions for tenancy and user assignments

The shape should match the dotCMS content type schema. See `content/mod-definition.json` in each mod for the expected format.

## schema/mod.schema.json

JSON Schema (Draft 2020-12) for validating mod manifests. Use with any JSON Schema validator (e.g. Ajv, `ajv-cli`).
