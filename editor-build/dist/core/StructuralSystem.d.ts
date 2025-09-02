import { ViewStateMachine } from './ViewStateMachine';
export interface AppStructureNode {
    id: string;
    name: string;
    type: 'application' | 'navigation' | 'main-content' | 'control' | 'input' | 'configuration' | 'information' | 'service-layer' | 'communication' | 'content-layer' | 'content-script' | 'content-control';
    component?: string;
    tome?: string;
    routing?: {
        path: string;
        children?: AppStructureNode[];
    };
    children?: AppStructureNode[];
}
export interface ComponentTomeMapping {
    [componentName: string]: {
        componentPath: string;
        tomePath: string;
        templatePath: string;
    };
}
export interface RouteConfig {
    path: string;
    component?: string;
    redirect?: string;
    children?: RouteConfig[];
}
export interface NavigationItem {
    id: string;
    label: string;
    path: string;
    icon?: string;
    children?: NavigationItem[];
}
export interface RoutingConfig {
    routes: RouteConfig[];
    navigation: {
        primary: NavigationItem[];
        secondary?: NavigationItem[];
    };
}
export interface TomeDefinition {
    machineId: string;
    description: string;
    states: string[];
    events: string[];
}
export interface TomeConfig {
    tomes: Record<string, TomeDefinition>;
    machineStates?: Record<string, Record<string, any>>;
}
export interface AppStructureConfig {
    AppStructure: AppStructureNode;
    ComponentTomeMapping: ComponentTomeMapping;
    RoutingConfig: RoutingConfig;
    TomeConfig: TomeConfig;
}
export declare class StructuralSystem {
    private config;
    private machines;
    private componentCache;
    constructor(config: AppStructureConfig);
    getAppStructure(): AppStructureNode;
    getComponentTomeMapping(): ComponentTomeMapping;
    getRoutingConfig(): RoutingConfig;
    getTomeConfig(): TomeConfig;
    createMachine(componentName: string, initialModel?: any): ViewStateMachine<any> | null;
    getMachine(componentName: string): ViewStateMachine<any> | undefined;
    getAllMachines(): Map<string, ViewStateMachine<any>>;
    findRoute(path: string): RouteConfig | null;
    getBreadcrumbs(path: string): NavigationItem[];
    findNavigationItem(path: string): NavigationItem | null;
    validate(): {
        isValid: boolean;
        errors: string[];
    };
    private createStatesFromTome;
    private createEventsFromTome;
}
export declare function useStructuralSystem(config: AppStructureConfig): StructuralSystem;
export declare function createStructuralSystem(config: AppStructureConfig): StructuralSystem;
export type { AppStructureNode, ComponentTomeMapping, RouteConfig, NavigationItem, RoutingConfig, TomeDefinition, TomeConfig, AppStructureConfig };
