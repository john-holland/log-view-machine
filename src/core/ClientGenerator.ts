import { ViewStateMachine, ViewStateMachineConfig } from './ViewStateMachine';

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

export class ClientGenerator {
  private machines: Map<string, ViewStateMachine<any>> = new Map();
  private configs: Map<string, ClientGeneratorConfig> = new Map();

  constructor() {}

  // Register a machine for discovery
  registerMachine(machineId: string, machine: ViewStateMachine<any>, config?: ClientGeneratorConfig): void {
    this.machines.set(machineId, machine);
    if (config) {
      this.configs.set(machineId, config);
    }
  }

  // Discover all registered machines
  discover(): ClientGeneratorDiscovery {
    const discovery: ClientGeneratorDiscovery = {
      machines: new Map(),
      states: new Map(),
      events: new Map(),
      actions: new Map(),
      services: new Map(),
      examples: [],
      documentation: ''
    };

    this.machines.forEach((machine, machineId) => {
      discovery.machines.set(machineId, machine);
      
      // Analyze machine structure
      const config = this.configs.get(machineId);
      if (config) {
        // Extract states, events, actions, services from XState config
        this.analyzeMachine(machine, machineId, discovery);
        
        // Add examples
        if (config.examples) {
          discovery.examples.push(...config.examples);
        }
      }
    });

    // Generate documentation
    discovery.documentation = this.generateDocumentation(discovery);

    return discovery;
  }

  private analyzeMachine(machine: ViewStateMachine<any>, machineId: string, discovery: ClientGeneratorDiscovery): void {
    // This would analyze the XState machine configuration
    // For now, we'll create a basic structure
    discovery.states.set(machineId, ['idle', 'creating', 'success', 'error']);
    discovery.events.set(machineId, ['ADD_INGREDIENT', 'CREATE_BURGER', 'CONTINUE']);
    discovery.actions.set(machineId, ['addIngredient', 'setLoading', 'handleSuccess']);
    discovery.services.set(machineId, ['createBurgerService']);
  }

  private generateDocumentation(discovery: ClientGeneratorDiscovery): string {
    let doc = '# ViewStateMachine Discovery\n\n';
    
    discovery.machines.forEach((machine, machineId) => {
      const config = this.configs.get(machineId);
      doc += `## ${machineId}\n\n`;
      
      if (config?.description) {
        doc += `${config.description}\n\n`;
      }

      const states = discovery.states.get(machineId) || [];
      const events = discovery.events.get(machineId) || [];
      const actions = discovery.actions.get(machineId) || [];
      const services = discovery.services.get(machineId) || [];

      doc += `### States\n`;
      states.forEach(state => {
        doc += `- \`${state}\`\n`;
      });
      doc += '\n';

      doc += `### Events\n`;
      events.forEach(event => {
        doc += `- \`${event}\`\n`;
      });
      doc += '\n';

      doc += `### Actions\n`;
      actions.forEach(action => {
        doc += `- \`${action}\`\n`;
      });
      doc += '\n';

      doc += `### Services\n`;
      services.forEach(service => {
        doc += `- \`${service}\`\n`;
      });
      doc += '\n';
    });

    return doc;
  }

  // Generate client code for a specific language
  generateClientCode(language: 'typescript' | 'javascript' | 'react' | 'kotlin' | 'java', machineId?: string): string {
    const discovery = this.discover();
    
    switch (language) {
      case 'typescript':
        return this.generateTypeScriptClient(discovery, machineId);
      case 'javascript':
        return this.generateJavaScriptClient(discovery, machineId);
      case 'react':
        return this.generateReactClient(discovery, machineId);
      case 'kotlin':
        return this.generateKotlinClient(discovery, machineId);
      case 'java':
        return this.generateJavaClient(discovery, machineId);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private generateTypeScriptClient(discovery: ClientGeneratorDiscovery, machineId?: string): string {
    let code = '// Generated TypeScript client\n\n';
    
    if (machineId) {
      const machine = discovery.machines.get(machineId);
      if (machine) {
        code += `import { ViewStateMachine } from './ViewStateMachine';\n\n`;
        code += `export class ${machineId}Client {\n`;
        code += `  private machine: ViewStateMachine<any>;\n\n`;
        code += `  constructor() {\n`;
        code += `    // Initialize machine\n`;
        code += `  }\n\n`;
        code += `  // Client methods would be generated here\n`;
        code += `}\n`;
      }
    } else {
      // Generate for all machines
      discovery.machines.forEach((machine, id) => {
        code += `export class ${id}Client {\n`;
        code += `  // Generated client for ${id}\n`;
        code += `}\n\n`;
      });
    }

    return code;
  }

  private generateJavaScriptClient(discovery: ClientGeneratorDiscovery, machineId?: string): string {
    let code = '// Generated JavaScript client\n\n';
    
    if (machineId) {
      code += `class ${machineId}Client {\n`;
      code += `  constructor() {\n`;
      code += `    // Initialize client\n`;
      code += `  }\n\n`;
      code += `  // Client methods\n`;
      code += `}\n\n`;
      code += `module.exports = ${machineId}Client;\n`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `class ${id}Client {\n`;
        code += `  // Generated client for ${id}\n`;
        code += `}\n\n`;
      });
    }

    return code;
  }

  private generateReactClient(discovery: ClientGeneratorDiscovery, machineId?: string): string {
    let code = '// Generated React client\n\n';
    code += `import React from 'react';\n`;
    code += `import { useViewStateMachine } from './ViewStateMachine';\n\n`;
    
    if (machineId) {
      code += `export const ${machineId}Component: React.FC = () => {\n`;
      code += `  const { state, send, log, view, clear } = useViewStateMachine({\n`;
      code += `    // Initial model\n`;
      code += `  });\n\n`;
      code += `  return (\n`;
      code += `    <div>\n`;
      code += `      {/* Generated UI */}\n`;
      code += `    </div>\n`;
      code += `  );\n`;
      code += `};\n`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `export const ${id}Component: React.FC = () => {\n`;
        code += `  // Generated component for ${id}\n`;
        code += `  return <div>${id} Component</div>;\n`;
        code += `};\n\n`;
      });
    }

    return code;
  }

  private generateKotlinClient(discovery: ClientGeneratorDiscovery, machineId?: string): string {
    let code = '// Generated Kotlin client\n\n';
    
    if (machineId) {
      code += `class ${machineId}Client {\n`;
      code += `  private val machine: ViewStateMachine<*>? = null\n\n`;
      code += `  fun initialize() {\n`;
      code += `    // Initialize machine\n`;
      code += `  }\n\n`;
      code += `  // Client methods\n`;
      code += `}\n`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `class ${id}Client {\n`;
        code += `  // Generated client for ${id}\n`;
        code += `}\n\n`;
      });
    }

    return code;
  }

  private generateJavaClient(discovery: ClientGeneratorDiscovery, machineId?: string): string {
    let code = '// Generated Java client\n\n';
    
    if (machineId) {
      code += `public class ${machineId}Client {\n`;
      code += `  private ViewStateMachine machine;\n\n`;
      code += `  public ${machineId}Client() {\n`;
      code += `    // Initialize machine\n`;
      code += `  }\n\n`;
      code += `  // Client methods\n`;
      code += `}\n`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `public class ${id}Client {\n`;
        code += `  // Generated client for ${id}\n`;
        code += `}\n\n`;
      });
    }

    return code;
  }

  // Generate integration examples
  generateIntegrationExamples(): ClientGeneratorExample[] {
    return [
      {
        name: 'Basic Usage',
        description: 'How to create and use a ViewStateMachine',
        language: 'typescript',
        code: `
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: { /* config */ }
})
.withState('idle', async ({ log, view }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
});`
      },
      {
        name: 'Sub-Machines',
        description: 'How to compose sub-machines',
        language: 'typescript',
        code: `
const parentMachine = createViewStateMachine({
  machineId: 'parent',
  xstateConfig: { /* config */ },
  subMachines: {
    child: { machineId: 'child', xstateConfig: { /* config */ } }
  }
})
.withSubMachine('child', childConfig);`
      },
      {
        name: 'ClientGenerator Discovery',
        description: 'How to use ClientGenerator for automated discovery',
        language: 'typescript',
        code: `
const clientGenerator = new ClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  examples: [/* examples */]
});

const discovery = clientGenerator.discover();
const clientCode = clientGenerator.generateClientCode('typescript', 'my-machine');`
      }
    ];
  }
}

// Helper function to create ClientGenerator
export function createClientGenerator(): ClientGenerator {
  return new ClientGenerator();
} 