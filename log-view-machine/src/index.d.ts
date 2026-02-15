/**
 * Minimal type declarations for log-view-machine (Cave server adapter and appShell).
 * Full types are in .ts sources; this allows dependent packages to resolve types when the project is not fully built.
 */
export interface AppShellDescriptor {
  name: string;
  scriptPath: string;
  cwd?: string;
  env?: Record<string, string>;
  pythonPath?: string;
  requirementsPath?: string;
  dependencies?: string[];
  pipInstall?: boolean | 'always' | 'once';
  venvPath?: string;
}

export interface AppShellRegistry {
  register(name: string, descriptor: AppShellDescriptor): void;
  get(name: string): AppShellDescriptor | undefined;
}

export interface CaveServerContext {
  cave: unknown;
  tomeConfigs: unknown[];
  variables: Record<string, string>;
  sections: Record<string, boolean>;
  appShellRegistryRef?: { current: AppShellRegistry };
  [key: string]: unknown;
}

export interface CaveServerAdapter {
  apply(context: CaveServerContext): Promise<void>;
}
