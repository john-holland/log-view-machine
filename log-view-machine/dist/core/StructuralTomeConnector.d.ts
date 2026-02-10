import React, { ReactNode } from 'react';
import { ViewStateMachine } from './ViewStateMachine';
import { StructuralSystem } from './StructuralSystem';
interface StructuralTomeConnectorProps {
    componentName: string;
    structuralSystem: StructuralSystem;
    initialModel?: any;
    onStateChange?: (state: string, model: any) => void;
    onLogEntry?: (entry: any) => void;
    onMachineCreated?: (machine: ViewStateMachine<any>) => void;
    children?: ReactNode | ((context: TomeConnectorContext) => ReactNode);
}
export interface TomeConnectorContext {
    machine: ViewStateMachine<any> | null;
    currentState: string;
    model: any;
    logEntries: any[];
    isLoading: boolean;
    error: string | null;
    sendEvent: (event: any) => void;
    updateModel: (updates: any) => void;
    componentName: string;
    tomeConfig: any;
    componentMapping: any;
}
export declare const StructuralTomeConnector: React.FC<StructuralTomeConnectorProps>;
export declare function useStructuralTomeConnector(componentName: string, structuralSystem: StructuralSystem): TomeConnectorContext;
export default StructuralTomeConnector;
