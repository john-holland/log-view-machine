/**
 * define-cavemod-adapter: ModConfig and ModDefinition types.
 */

export interface PathReplacement {
  modCaveId?: string;
  modTomeId?: string;
  spelunk?: Record<string, unknown>;
}

export interface AssetLinks {
  templates?: string;
  styles?: string;
  scripts?: string;
  serverUrl?: string;
}

export interface SpelunkMapEntry {
  route?: string;
  modCaveId?: string;
  modTomeId?: string;
  spelunk?: Record<string, unknown>;
}

export interface ModMetadata {
  pathReplacements?: Record<string, PathReplacement>;
  assetLinks?: AssetLinks;
  spelunkMap?: Record<string, SpelunkMapEntry>;
}

export interface ModConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  serverUrl: string;
  assets: Record<string, string>;
  entryPoints?: Record<string, string>;
  modMetadata?: ModMetadata;
  pactStatus?: 'good' | 'fail' | 'unknown';
  pactVerifiedAt?: string;
}

export interface DefineModOptions {
  id: string;
  name: string;
  description: string;
  version: string;
  serverUrl: string;
  assets: Record<string, string>;
  entryPoints?: Record<string, string>;
  pathReplacements?: Record<string, PathReplacement>;
  modMetadata?: ModMetadata;
  pactStatus?: 'good' | 'fail' | 'unknown';
  pactVerifiedAt?: string;
  dotcms?: {
    contentType?: string;
    folder?: string;
    assignToRoles?: string[];
  };
}

/**
 * dotCMS content API shape for Cavemod/ModDefinition content type.
 */
export interface ModDefinition {
  contentType: string;
  fields: {
    modId: string;
    modName: string;
    modDescription: string;
    modVersion: string;
    serverUrl: string;
    assets: Record<string, string>;
    entryPoints?: Record<string, string>;
    modMetadata?: ModMetadata;
  };
}
