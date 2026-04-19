import { ViewStateMachine, ViewStateMachineConfig } from '../Cave/tome/viewstatemachine/ViewStateMachine';

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

/** Parsed `contracts/lvm2/*-machines.json` from saurce / resaurce Node Cave hosts. */
export interface NodeCaveMachineManifestEntry {
  id: string;
  prefixes?: string[];
  structural_routes?: string[];
  xstate_states?: string[];
  xstate_events?: string[];
}

export interface NodeCaveMachineManifest {
  service: string;
  schema_version?: string;
  machines: NodeCaveMachineManifestEntry[];
}

export interface ClientGeneratorDiscovery {
  machines: Map<string, ViewStateMachine<any>>;
  states: Map<string, string[]>;
  events: Map<string, string[]>;
  actions: Map<string, string[]>;
  services: Map<string, string[]>;
  /** States that have a registered `withState` / `logStates` handler (same machineId key). */
  stateHandlers: Map<string, string[]>;
  examples: ClientGeneratorExample[];
  documentation: string;
  /** Flattened entries from manifests ingested via `ingestNodeCaveManifest`. */
  nodeCaveMachines?: Array<{
    service: string;
    machineId: string;
    prefixes: string[];
    structuralRoutes: string[];
    states: string[];
    events: string[];
  }>;
}

export function parseNodeCaveMachineManifest(raw: unknown): NodeCaveMachineManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const service = o.service;
  if (typeof service !== 'string' || !service.trim()) return null;
  const machines = o.machines;
  if (!Array.isArray(machines) || machines.length === 0) return null;
  const normalized: NodeCaveMachineManifestEntry[] = [];
  for (const m of machines) {
    if (!m || typeof m !== 'object') return null;
    const me = m as Record<string, unknown>;
    if (typeof me.id !== 'string' || !me.id.trim()) return null;
    normalized.push({
      id: me.id,
      prefixes: Array.isArray(me.prefixes) ? me.prefixes.filter((p): p is string => typeof p === 'string') : undefined,
      structural_routes: Array.isArray(me.structural_routes)
        ? me.structural_routes.filter((p): p is string => typeof p === 'string')
        : undefined,
      xstate_states: Array.isArray(me.xstate_states)
        ? me.xstate_states.filter((p): p is string => typeof p === 'string')
        : undefined,
      xstate_events: Array.isArray(me.xstate_events)
        ? me.xstate_events.filter((p): p is string => typeof p === 'string')
        : undefined,
    });
  }
  return {
    service,
    schema_version: typeof o.schema_version === 'string' ? o.schema_version : undefined,
    machines: normalized,
  };
}

export class ClientGenerator {
  private machines: Map<string, ViewStateMachine<any>> = new Map();
  private configs: Map<string, ClientGeneratorConfig> = new Map();
  private nodeCaveManifests: NodeCaveMachineManifest[] = [];

  constructor() {}

  // Register a machine for discovery
  registerMachine(machineId: string, machine: ViewStateMachine<any>, config?: ClientGeneratorConfig): void {
    this.machines.set(machineId, machine);
    const merged: ClientGeneratorConfig = {
      machineId,
      description: config?.description ?? `ViewStateMachine ${machineId}`,
      ...config,
    };
    this.configs.set(machineId, merged);
  }

  /** Register a saurce / resaurce `contracts/lvm2/*-machines.json` document for merged discovery output. */
  ingestNodeCaveManifest(manifest: unknown): boolean {
    const parsed = parseNodeCaveMachineManifest(manifest);
    if (!parsed) return false;
    this.nodeCaveManifests.push(parsed);
    return true;
  }

  private flattenNodeCaveManifests(): NonNullable<ClientGeneratorDiscovery['nodeCaveMachines']> {
    const out: NonNullable<ClientGeneratorDiscovery['nodeCaveMachines']> = [];
    for (const m of this.nodeCaveManifests) {
      for (const mc of m.machines) {
        out.push({
          service: m.service,
          machineId: mc.id,
          prefixes: mc.prefixes ?? [],
          structuralRoutes: mc.structural_routes ?? [],
          states: mc.xstate_states ?? [],
          events: mc.xstate_events ?? [],
        });
      }
    }
    return out;
  }

  // Discover all registered machines
  discover(): ClientGeneratorDiscovery {
    const discovery: ClientGeneratorDiscovery = {
      machines: new Map(),
      states: new Map(),
      events: new Map(),
      actions: new Map(),
      services: new Map(),
      stateHandlers: new Map(),
      examples: [],
      documentation: '',
      nodeCaveMachines: this.flattenNodeCaveManifests(),
    };

    this.machines.forEach((machine, machineId) => {
      discovery.machines.set(machineId, machine);
      this.analyzeMachine(machine, machineId, discovery);
      const config = this.configs.get(machineId);
      if (config?.examples) {
        discovery.examples.push(...config.examples);
      }
    });

    // Generate documentation
    discovery.documentation = this.generateDocumentation(discovery);

    return discovery;
  }

  private analyzeMachine(machine: ViewStateMachine<any>, machineId: string, discovery: ClientGeneratorDiscovery): void {
    const summary = machine.getXStateDefinitionSummary();
    discovery.states.set(machineId, summary.stateIds);
    const domainEvents = [...summary.transitionEvents, ...summary.internalRootEvents];
    discovery.events.set(machineId, [...new Set(domainEvents)].sort());
    discovery.actions.set(machineId, summary.actions);
    discovery.services.set(machineId, summary.services);
    discovery.stateHandlers.set(machineId, machine.getRegisteredStateHandlerNames().sort());
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
      const withStates = discovery.stateHandlers.get(machineId) || [];

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

      doc += `### withState handlers\n`;
      withStates.forEach((s) => {
        doc += `- \`${s}\`\n`;
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

    const nodeCave = discovery.nodeCaveMachines || [];
    if (nodeCave.length) {
      doc += '## Node Cave manifests (XState route interpreters)\n\n';
      nodeCave.forEach((row) => {
        doc += `### ${row.service} — ${row.machineId}\n\n`;
        doc += `- **Prefixes:** ${row.prefixes.map((p) => `\`${p}\``).join(', ') || '—'}\n`;
        doc += `- **Structural routes:** ${row.structuralRoutes.map((p) => `\`${p}\``).join(', ') || '—'}\n`;
        doc += `- **Chart states:** ${row.states.map((p) => `\`${p}\``).join(', ') || '—'}\n`;
        doc += `- **Chart events:** ${row.events.map((p) => `\`${p}\``).join(', ') || '—'}\n\n`;
      });
    }

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