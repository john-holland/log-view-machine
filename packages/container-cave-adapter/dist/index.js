"use strict";
/**
 * container-cave-adapter – Tome container adapter with header/footer tracking.
 *
 * Features:
 * - Header and footer injection with single-injection tracking per Cave/Tome
 * - Composed-view override with configurable container tag and classes
 * - Optional container override limit for sub-machine renders (default: infinite)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTAINER_ADAPTER_DESCRIPTOR = exports.useContainerAdapterFragmentsFromApi = exports.ContainerAdapterContext = exports.parseContainerOverrideTag = exports.useContainerAdapter = exports.ContainerAdapterProvider = void 0;
var ContainerAdapterContext_1 = require("./ContainerAdapterContext");
Object.defineProperty(exports, "ContainerAdapterProvider", { enumerable: true, get: function () { return ContainerAdapterContext_1.ContainerAdapterProvider; } });
Object.defineProperty(exports, "useContainerAdapter", { enumerable: true, get: function () { return ContainerAdapterContext_1.useContainerAdapter; } });
Object.defineProperty(exports, "parseContainerOverrideTag", { enumerable: true, get: function () { return ContainerAdapterContext_1.parseContainerOverrideTag; } });
Object.defineProperty(exports, "ContainerAdapterContext", { enumerable: true, get: function () { return ContainerAdapterContext_1.ContainerAdapterContext; } });
var useContainerAdapterFragments_1 = require("./useContainerAdapterFragments");
Object.defineProperty(exports, "useContainerAdapterFragmentsFromApi", { enumerable: true, get: function () { return useContainerAdapterFragments_1.useContainerAdapterFragmentsFromApi; } });
/** Adapter descriptor for discovery/listing. */
exports.CONTAINER_ADAPTER_DESCRIPTOR = {
    id: 'container-cave-adapter',
    name: 'Container Cave Adapter',
    type: 'typescript',
    features: ['header_tracking', 'footer_tracking', 'container_override', 'composed_view_override'],
    usedIn: ['log-view-machine', 'StructuralTomeConnector'],
};
