# Fish Burger Mod

Example mod demonstrating fish burger state machine with shopping cart functionality.

This mod replaces the removed `cart-tome` functionality, proving that the mod system can replace hardcoded features.

## Features

- Interactive fish burger ordering
- Shopping cart functionality
- State machine integration
- Checkout flow

## Usage

The mod can be loaded from the root landing page features section by clicking the "Try Fish Burger Cart" button.

## Backend

This mod connects to `node-fish-burger` server running on port 3004.

## Structure

```
fish-burger-mod/
├── mod.json              # Mod configuration
├── package.json          # Package metadata
├── README.md             # This file
├── assets/
│   ├── templates/        # HTML templates
│   ├── styles/           # CSS stylesheets
│   └── scripts/          # JavaScript modules
└── src/
    ├── components/       # Component definitions
    └── tomes/            # Tome configurations
```

## Mod Loading

The mod is loaded dynamically via the mod API:

1. Landing page calls `/api/mods/fish-burger-mod` to get mod configuration
2. Mod assets are loaded from the configured server URL
3. Mod template is injected into a modal overlay
4. Mod scripts initialize the fish burger cart functionality
