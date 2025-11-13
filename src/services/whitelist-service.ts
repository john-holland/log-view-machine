import fs from 'fs';
import path from 'path';

export interface ComponentWhitelist {
  version: string;
  lastUpdated: string;
  whitelistedComponents: Record<string, WhitelistedComponent>;
  globalRules: GlobalRules;
}

export interface WhitelistedComponent {
  name: string;
  description: string;
  moddable: boolean;
  badge: string;
  fileRules: FileRules;
  moddingRules: ModdingRules;
}

export interface FileRules {
  maxSizes: Record<string, number>;
  allowedTypes: string[];
  restrictedAPIs: string[];
  allowedAPIs: string[];
}

export interface ModdingRules {
  maxFiles: number;
  requirePreview: boolean;
  allowExternalResources: boolean;
  sandboxMode: boolean;
}

export interface GlobalRules {
  maxTotalSize: number;
  requireAuthentication: boolean;
  allowVersioning: boolean;
  autoSave: boolean;
  historyLimit: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  componentInfo?: WhitelistedComponent;
}

export interface ModValidationRequest {
  componentName: string;
  files: Record<string, string>;
  userId: string;
}

export class WhitelistService {
  private whitelist: ComponentWhitelist;
  private whitelistPath: string;

  constructor(whitelistPath?: string) {
    this.whitelistPath = whitelistPath || path.join(process.cwd(), 'src/config/component-whitelist.json');
    this.whitelist = this.loadWhitelist();
  }

  private loadWhitelist(): ComponentWhitelist {
    try {
      const whitelistData = fs.readFileSync(this.whitelistPath, 'utf8');
      return JSON.parse(whitelistData);
    } catch (error) {
      console.error('Failed to load component whitelist:', error);
      throw new Error('Component whitelist configuration not found');
    }
  }

  /**
   * Get all whitelisted components
   */
  getAllWhitelistedComponents(): Record<string, WhitelistedComponent> {
    return this.whitelist.whitelistedComponents;
  }

  /**
   * Get specific component whitelist rules
   */
  getComponentRules(componentName: string): WhitelistedComponent | null {
    return this.whitelist.whitelistedComponents[componentName] || null;
  }

  /**
   * Check if component is whitelisted
   */
  isComponentWhitelisted(componentName: string): boolean {
    return componentName in this.whitelist.whitelistedComponents;
  }

  /**
   * Validate mod against whitelist rules
   */
  validateMod(request: ModValidationRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if component is whitelisted
    const componentInfo = this.getComponentRules(request.componentName);
    if (!componentInfo) {
      return {
        isValid: false,
        errors: [`Component '${request.componentName}' is not whitelisted`],
        warnings: []
      };
    }

    // Validate file count
    const fileCount = Object.keys(request.files).length;
    if (fileCount > componentInfo.moddingRules.maxFiles) {
      errors.push(`Too many files: ${fileCount} exceeds maximum of ${componentInfo.moddingRules.maxFiles}`);
    }

    // Validate each file
    let totalSize = 0;
    for (const [filename, content] of Object.entries(request.files)) {
      const fileExtension = this.getFileExtension(filename);
      const fileSize = Buffer.byteLength(content, 'utf8');
      totalSize += fileSize;

      // Check file type is allowed
      if (!componentInfo.fileRules.allowedTypes.includes(fileExtension)) {
        errors.push(`File type '${fileExtension}' not allowed for ${filename}`);
      }

      // Check file size limit
      const maxSize = componentInfo.fileRules.maxSizes[fileExtension];
      if (maxSize && fileSize > maxSize) {
        errors.push(`File ${filename} exceeds size limit: ${fileSize} bytes > ${maxSize} bytes`);
      }

      // Check for restricted APIs
      const restrictedAPIs = this.detectRestrictedAPIs(content, componentInfo.fileRules.restrictedAPIs);
      if (restrictedAPIs.length > 0) {
        errors.push(`File ${filename} contains restricted APIs: ${restrictedAPIs.join(', ')}`);
      }

      // Check for allowed APIs (warnings only)
      const allowedAPIs = this.detectAllowedAPIs(content, componentInfo.fileRules.allowedAPIs);
      if (allowedAPIs.length === 0 && fileExtension === 'js') {
        warnings.push(`File ${filename} doesn't use any allowed APIs - consider adding functionality`);
      }
    }

    // Check total size
    if (totalSize > this.whitelist.globalRules.maxTotalSize) {
      errors.push(`Total mod size ${totalSize} bytes exceeds global limit of ${this.whitelist.globalRules.maxTotalSize} bytes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      componentInfo
    };
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Detect restricted APIs in code
   */
  private detectRestrictedAPIs(content: string, restrictedAPIs: string[]): string[] {
    const found: string[] = [];
    
    for (const api of restrictedAPIs) {
      if (api.includes('*')) {
        // Handle wildcard patterns like "chrome.*"
        const pattern = api.replace('*', '\\w*');
        const regex = new RegExp(`\\b${pattern}\\b`, 'g');
        if (regex.test(content)) {
          found.push(api);
        }
      } else {
        // Exact match
        const regex = new RegExp(`\\b${api}\\b`, 'g');
        if (regex.test(content)) {
          found.push(api);
        }
      }
    }
    
    return found;
  }

  /**
   * Detect allowed APIs in code
   */
  private detectAllowedAPIs(content: string, allowedAPIs: string[]): string[] {
    const found: string[] = [];
    
    for (const api of allowedAPIs) {
      const regex = new RegExp(`\\b${api}\\b`, 'g');
      if (regex.test(content)) {
        found.push(api);
      }
    }
    
    return found;
  }

  /**
   * Get whitelist metadata
   */
  getWhitelistMetadata(): { version: string; lastUpdated: string; componentCount: number } {
    return {
      version: this.whitelist.version,
      lastUpdated: this.whitelist.lastUpdated,
      componentCount: Object.keys(this.whitelist.whitelistedComponents).length
    };
  }

  /**
   * Get global rules
   */
  getGlobalRules(): GlobalRules {
    return this.whitelist.globalRules;
  }

  /**
   * Check if user can mod component
   */
  canUserModComponent(componentName: string, userId: string): boolean {
    const componentInfo = this.getComponentRules(componentName);
    if (!componentInfo) {
      return false;
    }

    // Check if component is moddable
    if (!componentInfo.moddable) {
      return false;
    }

    // Check authentication requirement
    if (this.whitelist.globalRules.requireAuthentication && !userId) {
      return false;
    }

    return true;
  }

  /**
   * Get component badge
   */
  getComponentBadge(componentName: string): string {
    const componentInfo = this.getComponentRules(componentName);
    return componentInfo?.badge || 'Not Moddable ❌';
  }

  /**
   * Reload whitelist from file
   */
  reloadWhitelist(): void {
    this.whitelist = this.loadWhitelist();
  }
}


