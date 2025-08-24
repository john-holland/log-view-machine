import { ViewStateMachine } from './ViewStateMachine';
export interface TeleportHQConfig {
    apiKey: string;
    projectId: string;
    environment: 'development' | 'staging' | 'production';
    enableRealTimeSync?: boolean;
    enableComponentStateSync?: boolean;
}
export interface TeleportHQComponent {
    id: string;
    name: string;
    props: Record<string, any>;
    children?: TeleportHQComponent[];
    state?: any;
    callbacks?: Record<string, string>;
}
export interface TeleportHQTemplate {
    id: string;
    name: string;
    components: TeleportHQComponent[];
    variables: Record<string, any>;
    stateSchema?: any;
}
export declare class TeleportHQAdapter {
    private config;
    private templates;
    private viewStateMachines;
    private robotCopy?;
    constructor(config: TeleportHQConfig);
    loadTemplate(templateId: string): Promise<TeleportHQTemplate>;
    createViewStateMachineFromTemplate(templateId: string, initialState?: any): ViewStateMachine<any>;
    private convertTemplateToViewStateMachineConfig;
    private extractStateVariables;
    private createEventsFromCallbacks;
    private renderTeleportHQComponents;
    private createReactComponentFromTeleportHQ;
    syncWithTeleportHQ(viewStateMachine: ViewStateMachine<any>, templateId: string): void;
    private setupRealTimeSync;
    exportToTeleportHQ(templateId: string, state: any): Promise<void>;
    getLoadedTemplates(): string[];
    getViewStateMachine(templateId: string): ViewStateMachine<any> | undefined;
}
export declare function createTeleportHQAdapter(config: TeleportHQConfig): TeleportHQAdapter;
