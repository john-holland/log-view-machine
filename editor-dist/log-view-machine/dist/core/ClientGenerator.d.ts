import { ViewStateMachine } from './ViewStateMachine';
export interface ClientGeneratorConfig {
    machineId: string;
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
    examples?: ClientGeneratorExample[];
}
export interface ClientGeneratorExample {
    name: string;
    description: string;
    code: string;
    language: 'typescript' | 'javascript' | 'react' | 'kotlin' | 'java';
}
export interface ClientGeneratorDiscovery {
    machines: Map<string, ViewStateMachine<any>>;
    states: Map<string, string[]>;
    events: Map<string, string[]>;
    actions: Map<string, string[]>;
    services: Map<string, string[]>;
    examples: ClientGeneratorExample[];
    documentation: string;
}
export declare class ClientGenerator {
    private machines;
    private configs;
    constructor();
    registerMachine(machineId: string, machine: ViewStateMachine<any>, config?: ClientGeneratorConfig): void;
    discover(): ClientGeneratorDiscovery;
    private analyzeMachine;
    private generateDocumentation;
    generateClientCode(language: 'typescript' | 'javascript' | 'react' | 'kotlin' | 'java', machineId?: string): string;
    private generateTypeScriptClient;
    private generateJavaScriptClient;
    private generateReactClient;
    private generateKotlinClient;
    private generateJavaClient;
    generateIntegrationExamples(): ClientGeneratorExample[];
}
export declare function createClientGenerator(): ClientGenerator;
