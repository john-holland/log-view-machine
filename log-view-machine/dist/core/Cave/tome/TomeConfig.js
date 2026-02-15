/**
 * TomeConfig - Configuration for Tome routing and state management
 *
 * This interface defines how tomes can be configured with routing support,
 * allowing each tome to insert gracefully into a routing hierarchy.
 */
/** Safe env read for Node; returns undefined in browser so config can use fallbacks. */
function getEnv(name) {
    try {
        // eslint-disable-next-line no-restricted-globals
        return typeof globalThis.process !== 'undefined' && globalThis.process.env
            ? globalThis.process.env[name]
            : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Create a TomeConfig with routing support
 */
export function createTomeConfig(config) {
    return {
        id: config.id || 'default-tome',
        name: config.name || 'Default Tome',
        description: config.description || 'A configured tome with routing support',
        version: config.version || '1.0.0',
        renderKey: config.renderKey,
        machines: config.machines || {},
        routing: {
            basePath: config.routing?.basePath || '/api',
            routes: config.routing?.routes || {},
            middleware: config.routing?.middleware || [],
            cors: config.routing?.cors ?? true,
            rateLimit: config.routing?.rateLimit || {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            },
            authentication: config.routing?.authentication || {
                required: false
            }
        },
        context: config.context || {},
        dependencies: config.dependencies || [],
        plugins: config.plugins || [],
        graphql: {
            enabled: config.graphql?.enabled ?? true,
            schema: config.graphql?.schema,
            resolvers: config.graphql?.resolvers || {},
            subscriptions: config.graphql?.subscriptions ?? true
        },
        logging: {
            level: config.logging?.level || 'info',
            format: config.logging?.format || 'json',
            transports: config.logging?.transports || ['console']
        },
        persistence: {
            enabled: config.persistence?.enabled ?? false,
            type: config.persistence?.type || 'memory',
            config: config.persistence?.config || {}
        },
        monitoring: {
            enabled: config.monitoring?.enabled ?? true,
            metrics: config.monitoring?.metrics || ['requests', 'errors', 'performance'],
            tracing: config.monitoring?.tracing ?? true,
            healthChecks: config.monitoring?.healthChecks || ['/health']
        },
        isModableTome: config.isModableTome,
        modMetadata: config.modMetadata,
        permission: config.permission
    };
}
/**
 * Example TomeConfig for Fish Burger system
 */
export const FishBurgerTomeConfig = createTomeConfig({
    id: 'fish-burger-tome',
    name: 'Fish Burger System',
    description: 'Complete fish burger ordering and cooking system',
    version: '1.0.0',
    machines: {
        orderMachine: {
            id: 'order-machine',
            name: 'Order Management',
            description: 'Handles order creation and management',
            xstateConfig: {
                id: 'order-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { CREATE_ORDER: 'processing' }
                    },
                    processing: {
                        on: { COMPLETE_ORDER: 'completed' }
                    },
                    completed: {
                        on: { RESET: 'idle' }
                    }
                }
            }
        },
        cookingMachine: {
            id: 'cooking-machine',
            name: 'Cooking System',
            description: 'Manages the cooking process',
            xstateConfig: {
                id: 'cooking-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { START_COOKING: 'cooking' }
                    },
                    cooking: {
                        on: { COMPLETE_COOKING: 'completed' }
                    },
                    completed: {
                        on: { RESET: 'idle' }
                    }
                }
            }
        }
    },
    routing: {
        basePath: '/api/fish-burger',
        routes: {
            orderMachine: {
                path: '/orders',
                method: 'POST'
            },
            cookingMachine: {
                path: '/cooking',
                method: 'POST'
            }
        }
    },
    context: {
        baseUrl: 'http://localhost:3000',
        adminKey: getEnv('ADMIN_KEY') || 'admin123'
    }
});
/**
 * Example TomeConfig for Editor system
 */
export const EditorTomeConfig = createTomeConfig({
    id: 'editor-tome',
    name: 'Component Editor System',
    description: 'Visual component editor with real-time preview',
    version: '1.0.0',
    machines: {
        editorMachine: {
            id: 'editor-machine',
            name: 'Component Editor',
            description: 'Main editor interface',
            xstateConfig: {
                id: 'editor-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { LOAD_COMPONENT: 'editing' }
                    },
                    editing: {
                        on: { SAVE: 'saving' }
                    },
                    saving: {
                        on: { SAVE_SUCCESS: 'editing' }
                    }
                }
            }
        },
        previewMachine: {
            id: 'preview-machine',
            name: 'Preview System',
            description: 'Real-time component preview',
            xstateConfig: {
                id: 'preview-machine',
                initial: 'idle',
                states: {
                    idle: {
                        on: { UPDATE_PREVIEW: 'updating' }
                    },
                    updating: {
                        on: { PREVIEW_READY: 'ready' }
                    },
                    ready: {
                        on: { UPDATE_PREVIEW: 'updating' }
                    }
                }
            }
        }
    },
    routing: {
        basePath: '/api/editor',
        routes: {
            editorMachine: {
                path: '/components',
                method: 'POST'
            },
            previewMachine: {
                path: '/preview',
                method: 'POST'
            }
        }
    },
    context: {
        editorType: 'generic',
        previewMode: 'iframe'
    },
    persistence: {
        enabled: true,
        adapter: 'duckdb',
        config: {}
    }
});
/**
 * Library TomeConfig - Component library state for the generic editor.
 */
export const LibraryTomeConfig = createTomeConfig({
    id: 'library-tome',
    name: 'Component Library',
    description: 'Component library state and discovery',
    version: '1.0.0',
    machines: {
        libraryMachine: {
            id: 'library-machine',
            name: 'Library',
            description: 'Library state',
            xstateConfig: {
                id: 'library-machine',
                initial: 'idle',
                states: {
                    idle: { on: { OPEN: 'browsing' } },
                    browsing: { on: { SELECT: 'idle', CLOSE: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/library',
        routes: {
            libraryMachine: { path: '/', method: 'POST' },
        },
    },
});
/**
 * Cart TomeConfig - Cart state (e.g. cooked burgers, checkout) for the generic editor.
 */
export const CartTomeConfig = createTomeConfig({
    id: 'cart-tome',
    name: 'Cart',
    description: 'Cart state and checkout',
    version: '1.0.0',
    machines: {
        cartMachine: {
            id: 'cart-machine',
            name: 'Cart',
            description: 'Cart state',
            xstateConfig: {
                id: 'cart-machine',
                initial: 'idle',
                states: {
                    idle: { on: { ADD: 'active' } },
                    active: { on: { CHECKOUT: 'idle', CLEAR: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/cart',
        routes: {
            cartMachine: { path: '/', method: 'POST' },
        },
    },
});
/**
 * Donation TomeConfig - Mod author / sticky-coins (Solana) state for the generic editor.
 */
export const DonationTomeConfig = createTomeConfig({
    id: 'donation-tome',
    name: 'Donation',
    description: 'Mod author donation and sticky coins',
    version: '1.0.0',
    machines: {
        donationMachine: {
            id: 'donation-machine',
            name: 'Donation',
            description: 'Donation / wallet state',
            xstateConfig: {
                id: 'donation-machine',
                initial: 'idle',
                states: {
                    idle: { on: { CONNECT_WALLET: 'connected' } },
                    connected: { on: { DONATE: 'idle', DISCONNECT: 'idle' } },
                },
            },
        },
    },
    routing: {
        basePath: '/api/editor/donation',
        routes: {
            donationMachine: { path: '/', method: 'POST' },
        },
    },
});
