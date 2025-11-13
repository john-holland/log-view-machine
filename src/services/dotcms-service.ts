/**
 * dotCMS Integration Service
 * 
 * Handles mod storage, versioning, and content management through dotCMS REST API.
 * Provides warehousing for undo/history functionality.
 */

export interface DotCMSConfig {
    baseUrl: string;
    username: string;
    password: string;
    siteId: string;
    contentTypeId: string; // WaveReaderMod content type
}

export interface ModContent {
    id?: string;
    name: string;
    author: string;
    componentName: string;
    description: string;
    version: string;
    files: Record<string, string>;
    metadata: Record<string, any>;
    status: 'draft' | 'published' | 'archived';
    createdAt?: string;
    updatedAt?: string;
}

export interface ModVersion {
    id: string;
    modId: string;
    version: string;
    content: ModContent;
    createdAt: string;
    isActive: boolean;
}

export interface ContentWarehouse {
    id: string;
    userId: string;
    modId: string;
    contentType: 'mod' | 'version' | 'history';
    content: any;
    version: number;
    createdAt: string;
}

export class DotCMSService {
    private config: DotCMSConfig;
    private authToken: string | null = null;

    constructor(config: DotCMSConfig) {
        this.config = config;
    }

    /**
     * Authenticate with dotCMS
     */
    async authenticate(): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/v1/authentication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: this.config.username,
                    password: this.config.password,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                return true;
            }
            return false;
        } catch (error) {
            console.error('dotCMS authentication failed:', error);
            return false;
        }
    }

    /**
     * Get authentication headers
     */
    private getAuthHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Create a new mod in dotCMS
     */
    async createMod(mod: ModContent): Promise<ModContent> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                contentType: this.config.contentTypeId,
                siteId: this.config.siteId,
                title: mod.name,
                fields: {
                    name: mod.name,
                    author: mod.author,
                    componentName: mod.componentName,
                    description: mod.description,
                    version: mod.version,
                    files: JSON.stringify(mod.files),
                    metadata: JSON.stringify(mod.metadata),
                    status: mod.status,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create mod: ${response.statusText}`);
        }

        const result = await response.json();
        return {
            ...mod,
            id: result.id,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
    }

    /**
     * Get mod by ID
     */
    async getMod(id: string): Promise<ModContent | null> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content/${id}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to get mod: ${response.statusText}`);
        }

        const result = await response.json();
        return this.mapDotCMSContentToMod(result);
    }

    /**
     * Update mod
     */
    async updateMod(id: string, mod: Partial<ModContent>): Promise<ModContent> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                fields: {
                    name: mod.name,
                    author: mod.author,
                    componentName: mod.componentName,
                    description: mod.description,
                    version: mod.version,
                    files: mod.files ? JSON.stringify(mod.files) : undefined,
                    metadata: mod.metadata ? JSON.stringify(mod.metadata) : undefined,
                    status: mod.status,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update mod: ${response.statusText}`);
        }

        const result = await response.json();
        return this.mapDotCMSContentToMod(result);
    }

    /**
     * Delete mod
     */
    async deleteMod(id: string): Promise<boolean> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        return response.ok;
    }

    /**
     * List mods for a user
     */
    async getUserMods(userId: string): Promise<ModContent[]> {
        await this.ensureAuthenticated();

        const response = await fetch(
            `${this.config.baseUrl}/api/v1/content?contentType=${this.config.contentTypeId}&author=${userId}`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get user mods: ${response.statusText}`);
        }

        const result = await response.json();
        return result.entries.map((entry: any) => this.mapDotCMSContentToMod(entry));
    }

    /**
     * Create mod version for history/undo functionality
     */
    async createModVersion(modId: string, version: string, content: ModContent): Promise<ModVersion> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                contentType: 'WaveReaderModVersion',
                siteId: this.config.siteId,
                title: `${content.name} v${version}`,
                fields: {
                    modId: modId,
                    version: version,
                    content: JSON.stringify(content),
                    isActive: true,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create mod version: ${response.statusText}`);
        }

        const result = await response.json();
        return {
            id: result.id,
            modId: modId,
            version: version,
            content: content,
            createdAt: result.createdAt,
            isActive: true,
        };
    }

    /**
     * Get mod versions
     */
    async getModVersions(modId: string): Promise<ModVersion[]> {
        await this.ensureAuthenticated();

        const response = await fetch(
            `${this.config.baseUrl}/api/v1/content?contentType=WaveReaderModVersion&modId=${modId}`,
            {
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get mod versions: ${response.statusText}`);
        }

        const result = await response.json();
        return result.entries.map((entry: any) => ({
            id: entry.id,
            modId: entry.fields.modId,
            version: entry.fields.version,
            content: JSON.parse(entry.fields.content),
            createdAt: entry.createdAt,
            isActive: entry.fields.isActive,
        }));
    }

    /**
     * Warehouse content for undo/history
     */
    async warehouseContent(
        userId: string,
        modId: string,
        contentType: 'mod' | 'version' | 'history',
        content: any
    ): Promise<ContentWarehouse> {
        await this.ensureAuthenticated();

        const response = await fetch(`${this.config.baseUrl}/api/v1/content`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                contentType: 'WaveReaderContentWarehouse',
                siteId: this.config.siteId,
                title: `Warehouse ${contentType} for mod ${modId}`,
                fields: {
                    userId: userId,
                    modId: modId,
                    contentType: contentType,
                    content: JSON.stringify(content),
                    version: 1,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to warehouse content: ${response.statusText}`);
        }

        const result = await response.json();
        return {
            id: result.id,
            userId: userId,
            modId: modId,
            contentType: contentType,
            content: content,
            version: 1,
            createdAt: result.createdAt,
        };
    }

    /**
     * Get warehouse content for undo/history
     */
    async getWarehouseContent(
        userId: string,
        modId: string,
        contentType?: 'mod' | 'version' | 'history'
    ): Promise<ContentWarehouse[]> {
        await this.ensureAuthenticated();

        let url = `${this.config.baseUrl}/api/v1/content?contentType=WaveReaderContentWarehouse&userId=${userId}&modId=${modId}`;
        if (contentType) {
            url += `&contentType=${contentType}`;
        }

        const response = await fetch(url, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get warehouse content: ${response.statusText}`);
        }

        const result = await response.json();
        return result.entries.map((entry: any) => ({
            id: entry.id,
            userId: entry.fields.userId,
            modId: entry.fields.modId,
            contentType: entry.fields.contentType,
            content: JSON.parse(entry.fields.content),
            version: entry.fields.version,
            createdAt: entry.createdAt,
        }));
    }

    /**
     * Ensure we're authenticated
     */
    private async ensureAuthenticated(): Promise<void> {
        if (!this.authToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                throw new Error('Failed to authenticate with dotCMS');
            }
        }
    }

    /**
     * Map dotCMS content to ModContent
     */
    private mapDotCMSContentToMod(content: any): ModContent {
        return {
            id: content.id,
            name: content.fields.name,
            author: content.fields.author,
            componentName: content.fields.componentName,
            description: content.fields.description,
            version: content.fields.version,
            files: JSON.parse(content.fields.files || '{}'),
            metadata: JSON.parse(content.fields.metadata || '{}'),
            status: content.fields.status,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt,
        };
    }
}

/**
 * Initialize dotCMS service with configuration
 */
export const initializeDotCMSService = (config: DotCMSConfig): DotCMSService => {
    return new DotCMSService(config);
};

/**
 * Mock dotCMS service for development
 */
export class MockDotCMSService extends DotCMSService {
    private mockMods: Map<string, ModContent> = new Map();
    private mockVersions: Map<string, ModVersion[]> = new Map();
    private mockWarehouse: Map<string, ContentWarehouse[]> = new Map();

    constructor() {
        super({
            baseUrl: 'http://localhost:8080',
            username: 'admin',
            password: 'admin',
            siteId: 'default',
            contentTypeId: 'WaveReaderMod',
        });
    }

    async authenticate(): Promise<boolean> {
        this.authToken = 'mock-token';
        return true;
    }

    async createMod(mod: ModContent): Promise<ModContent> {
        const id = `mod-${Date.now()}`;
        const createdMod = {
            ...mod,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.mockMods.set(id, createdMod);
        return createdMod;
    }

    async getMod(id: string): Promise<ModContent | null> {
        return this.mockMods.get(id) || null;
    }

    async updateMod(id: string, mod: Partial<ModContent>): Promise<ModContent> {
        const existing = this.mockMods.get(id);
        if (!existing) throw new Error('Mod not found');

        const updated = {
            ...existing,
            ...mod,
            updatedAt: new Date().toISOString(),
        };
        this.mockMods.set(id, updated);
        return updated;
    }

    async deleteMod(id: string): Promise<boolean> {
        return this.mockMods.delete(id);
    }

    async getUserMods(userId: string): Promise<ModContent[]> {
        return Array.from(this.mockMods.values()).filter(mod => mod.author === userId);
    }

    async createModVersion(modId: string, version: string, content: ModContent): Promise<ModVersion> {
        const versionId = `version-${Date.now()}`;
        const modVersion: ModVersion = {
            id: versionId,
            modId,
            version,
            content,
            createdAt: new Date().toISOString(),
            isActive: true,
        };

        const versions = this.mockVersions.get(modId) || [];
        versions.push(modVersion);
        this.mockVersions.set(modId, versions);

        return modVersion;
    }

    async getModVersions(modId: string): Promise<ModVersion[]> {
        return this.mockVersions.get(modId) || [];
    }

    async warehouseContent(
        userId: string,
        modId: string,
        contentType: 'mod' | 'version' | 'history',
        content: any
    ): Promise<ContentWarehouse> {
        const warehouseId = `warehouse-${Date.now()}`;
        const warehouse: ContentWarehouse = {
            id: warehouseId,
            userId,
            modId,
            contentType,
            content,
            version: 1,
            createdAt: new Date().toISOString(),
        };

        const key = `${userId}-${modId}`;
        const existing = this.mockWarehouse.get(key) || [];
        existing.push(warehouse);
        this.mockWarehouse.set(key, existing);

        return warehouse;
    }

    async getWarehouseContent(
        userId: string,
        modId: string,
        contentType?: 'mod' | 'version' | 'history'
    ): Promise<ContentWarehouse[]> {
        const key = `${userId}-${modId}`;
        const allContent = this.mockWarehouse.get(key) || [];
        
        if (contentType) {
            return allContent.filter(item => item.contentType === contentType);
        }
        
        return allContent;
    }
}
