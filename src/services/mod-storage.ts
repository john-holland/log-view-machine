import fs from 'fs';
import path from 'path';

export interface ModVersion {
  version: string;
  timestamp: number;
  files: Record<string, string>;
  metadata: {
    author: string;
    description?: string;
    changes?: string[];
    size: number;
  };
}

export interface ModMetadata {
  id: string;
  name: string;
  componentName: string;
  author: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  currentVersion: string;
  versions: string[];
  tags: string[];
  isPublic: boolean;
}

export interface StorageResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ModStorageService {
  private warehousePath: string;
  private maxVersions: number = 50;

  constructor(warehousePath?: string) {
    this.warehousePath = warehousePath || path.join(process.cwd(), 'mods-warehouse');
    this.ensureWarehouseExists();
  }

  private ensureWarehouseExists(): void {
    if (!fs.existsSync(this.warehousePath)) {
      fs.mkdirSync(this.warehousePath, { recursive: true });
    }
  }

  private getUserPath(userId: string): string {
    return path.join(this.warehousePath, userId);
  }

  private getModPath(userId: string, modId: string): string {
    return path.join(this.getUserPath(userId), modId);
  }

  private getVersionPath(userId: string, modId: string, version: string): string {
    return path.join(this.getModPath(userId, modId), 'versions', version);
  }

  private getCurrentPath(userId: string, modId: string): string {
    return path.join(this.getModPath(userId, modId), 'current');
  }

  private getMetadataPath(userId: string, modId: string): string {
    return path.join(this.getModPath(userId, modId), 'metadata.json');
  }

  /**
   * Save a new version of a mod
   */
  async saveModVersion(
    userId: string,
    modId: string,
    files: Record<string, string>,
    metadata: {
      author: string;
      description?: string;
      changes?: string[];
    }
  ): Promise<StorageResult> {
    try {
      // Ensure user directory exists
      const userPath = this.getUserPath(userId);
      if (!fs.existsSync(userPath)) {
        fs.mkdirSync(userPath, { recursive: true });
      }

      // Ensure mod directory exists
      const modPath = this.getModPath(userId, modId);
      if (!fs.existsSync(modPath)) {
        fs.mkdirSync(modPath, { recursive: true });
        fs.mkdirSync(path.join(modPath, 'versions'), { recursive: true });
        fs.mkdirSync(this.getCurrentPath(userId, modId), { recursive: true });
      }

      // Generate version number
      const version = await this.getNextVersion(userId, modId);
      const versionPath = this.getVersionPath(userId, modId, version);

      // Save files to version directory
      fs.mkdirSync(versionPath, { recursive: true });
      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(versionPath, filename);
        fs.writeFileSync(filePath, content, 'utf8');
      }

      // Calculate total size
      const totalSize = Object.values(files).reduce((sum, content) => sum + Buffer.byteLength(content, 'utf8'), 0);

      // Create version metadata
      const versionData: ModVersion = {
        version,
        timestamp: Date.now(),
        files,
        metadata: {
          ...metadata,
          size: totalSize
        }
      };

      // Save version metadata
      fs.writeFileSync(
        path.join(versionPath, 'version.json'),
        JSON.stringify(versionData, null, 2),
        'utf8'
      );

      // Update current files
      const currentPath = this.getCurrentPath(userId, modId);
      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(currentPath, filename);
        fs.writeFileSync(filePath, content, 'utf8');
      }

      // Update mod metadata
      await this.updateModMetadata(userId, modId, {
        currentVersion: version,
        updatedAt: Date.now()
      });

      return {
        success: true,
        message: `Mod version ${version} saved successfully`,
        data: { version, timestamp: versionData.timestamp }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to save mod version',
        error: error.message
      };
    }
  }

  /**
   * Get version history for a mod
   */
  async getModVersions(userId: string, modId: string): Promise<StorageResult> {
    try {
      const versionsPath = path.join(this.getModPath(userId, modId), 'versions');
      
      if (!fs.existsSync(versionsPath)) {
        return {
          success: true,
          message: 'No versions found',
          data: { versions: [] }
        };
      }

      const versionDirs = fs.readdirSync(versionsPath)
        .filter(dir => fs.statSync(path.join(versionsPath, dir)).isDirectory())
        .sort((a, b) => {
          // Sort by version number (v1, v2, etc.)
          const aNum = parseInt(a.replace('v', ''));
          const bNum = parseInt(b.replace('v', ''));
          return aNum - bNum;
        });

      const versions = [];
      for (const versionDir of versionDirs) {
        const versionPath = path.join(versionsPath, versionDir);
        const versionFile = path.join(versionPath, 'version.json');
        
        if (fs.existsSync(versionFile)) {
          const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
          versions.push({
            version: versionData.version,
            timestamp: versionData.timestamp,
            metadata: versionData.metadata
          });
        }
      }

      return {
        success: true,
        message: 'Versions retrieved successfully',
        data: { versions }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get mod versions',
        error: error.message
      };
    }
  }

  /**
   * Get specific version of a mod
   */
  async getModVersion(userId: string, modId: string, version: string): Promise<StorageResult> {
    try {
      const versionPath = this.getVersionPath(userId, modId, version);
      
      if (!fs.existsSync(versionPath)) {
        return {
          success: false,
          message: `Version ${version} not found`
        };
      }

      // Read version metadata
      const versionFile = path.join(versionPath, 'version.json');
      const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

      // Read all files in version
      const files: Record<string, string> = {};
      const fileList = fs.readdirSync(versionPath)
        .filter(file => file !== 'version.json');

      for (const filename of fileList) {
        const filePath = path.join(versionPath, filename);
        if (fs.statSync(filePath).isFile()) {
          files[filename] = fs.readFileSync(filePath, 'utf8');
        }
      }

      return {
        success: true,
        message: `Version ${version} retrieved successfully`,
        data: {
          version: versionData.version,
          timestamp: versionData.timestamp,
          files,
          metadata: versionData.metadata
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get mod version',
        error: error.message
      };
    }
  }

  /**
   * Restore a specific version
   */
  async restoreModVersion(userId: string, modId: string, version: string): Promise<StorageResult> {
    try {
      // Get the version data
      const versionResult = await this.getModVersion(userId, modId, version);
      if (!versionResult.success) {
        return versionResult;
      }

      const { files } = versionResult.data;

      // Update current files
      const currentPath = this.getCurrentPath(userId, modId);
      for (const [filename, content] of Object.entries(files)) {
        const filePath = path.join(currentPath, filename);
        fs.writeFileSync(filePath, content as string, 'utf8');
      }

      // Update metadata
      await this.updateModMetadata(userId, modId, {
        currentVersion: version,
        updatedAt: Date.now()
      });

      return {
        success: true,
        message: `Mod restored to version ${version}`,
        data: { restoredVersion: version }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to restore mod version',
        error: error.message
      };
    }
  }

  /**
   * Get current mod files
   */
  async getCurrentMod(userId: string, modId: string): Promise<StorageResult> {
    try {
      const currentPath = this.getCurrentPath(userId, modId);
      
      if (!fs.existsSync(currentPath)) {
        return {
          success: false,
          message: 'Mod not found'
        };
      }

      const files: Record<string, string> = {};
      const fileList = fs.readdirSync(currentPath);

      for (const filename of fileList) {
        const filePath = path.join(currentPath, filename);
        if (fs.statSync(filePath).isFile()) {
          files[filename] = fs.readFileSync(filePath, 'utf8');
        }
      }

      return {
        success: true,
        message: 'Current mod retrieved successfully',
        data: { files }
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get current mod',
        error: error.message
      };
    }
  }

  /**
   * Get mod metadata
   */
  async getModMetadata(userId: string, modId: string): Promise<StorageResult> {
    try {
      const metadataPath = this.getMetadataPath(userId, modId);
      
      if (!fs.existsSync(metadataPath)) {
        return {
          success: false,
          message: 'Mod metadata not found'
        };
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      return {
        success: true,
        message: 'Mod metadata retrieved successfully',
        data: metadata
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get mod metadata',
        error: error.message
      };
    }
  }

  /**
   * Update mod metadata
   */
  private async updateModMetadata(userId: string, modId: string, updates: Partial<ModMetadata>): Promise<void> {
    const metadataPath = this.getMetadataPath(userId, modId);
    
    let metadata: ModMetadata;
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } else {
      // Create new metadata
      metadata = {
        id: modId,
        name: `Mod ${modId}`,
        componentName: '',
        author: userId,
        description: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentVersion: 'v1',
        versions: [],
        tags: [],
        isPublic: false
      };
    }

    // Update metadata
    Object.assign(metadata, updates);

    // Ensure versions array is updated
    if (updates.currentVersion && !metadata.versions.includes(updates.currentVersion)) {
      metadata.versions.push(updates.currentVersion);
    }

    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Get next version number
   */
  private async getNextVersion(userId: string, modId: string): Promise<string> {
    const versionsPath = path.join(this.getModPath(userId, modId), 'versions');
    
    if (!fs.existsSync(versionsPath)) {
      return 'v1';
    }

    const versionDirs = fs.readdirSync(versionsPath)
      .filter(dir => fs.statSync(path.join(versionsPath, dir)).isDirectory())
      .map(dir => parseInt(dir.replace('v', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => b - a);

    if (versionDirs.length === 0) {
      return 'v1';
    }

    return `v${versionDirs[0] + 1}`;
  }

  /**
   * Clean up old versions (keep only last N versions)
   */
  async cleanupOldVersions(userId: string, modId: string): Promise<StorageResult> {
    try {
      const versionsResult = await this.getModVersions(userId, modId);
      if (!versionsResult.success) {
        return versionsResult;
      }

      const versions = versionsResult.data.versions;
      if (versions.length <= this.maxVersions) {
        return {
          success: true,
          message: 'No cleanup needed'
        };
      }

      // Remove oldest versions
      const versionsToRemove = versions.slice(0, versions.length - this.maxVersions);
      const versionsPath = path.join(this.getModPath(userId, modId), 'versions');

      for (const version of versionsToRemove) {
        const versionPath = path.join(versionsPath, version.version);
        if (fs.existsSync(versionPath)) {
          fs.rmSync(versionPath, { recursive: true, force: true });
        }
      }

      return {
        success: true,
        message: `Cleaned up ${versionsToRemove.length} old versions`
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to cleanup old versions',
        error: error.message
      };
    }
  }
}


