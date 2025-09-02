import React, { ReactNode } from 'react';
import { StructuralSystem, AppStructureConfig, NavigationItem } from './StructuralSystem';
export interface RouterContextType {
    currentRoute: string;
    navigate: (path: string) => void;
    goBack: () => void;
    breadcrumbs: NavigationItem[];
    structuralSystem: StructuralSystem;
}
export declare function useRouter(): RouterContextType;
interface StructuralRouterProps {
    config: AppStructureConfig;
    initialRoute?: string;
    onRouteChange?: (route: string) => void;
    children: ReactNode;
}
export declare const StructuralRouter: React.FC<StructuralRouterProps>;
interface RouteProps {
    path: string;
    component: React.ComponentType<any>;
    fallback?: React.ComponentType<any>;
}
export declare const Route: React.FC<RouteProps>;
export declare const RouteFallback: React.FC;
export default StructuralRouter;
