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
    contentTypeId: string;
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
export declare class DotCMSService {
    private config;
    private authToken;
    constructor(config: DotCMSConfig);
    /**
     * Authenticate with dotCMS
     */
    authenticate(): Promise<boolean>;
    /**
     * Get authentication headers
     */
    private getAuthHeaders;
    /**
     * Create a new mod in dotCMS
     */
    createMod(mod: ModContent): Promise<ModContent>;
    /**
     * Get mod by ID
     */
    getMod(id: string): Promise<ModContent | null>;
    /**
     * Update mod
     */
    updateMod(id: string, mod: Partial<ModContent>): Promise<ModContent>;
    /**
     * Delete mod
     */
    deleteMod(id: string): Promise<boolean>;
    /**
     * List mods for a user
     */
    getUserMods(userId: string): Promise<ModContent[]>;
    /**
     * Create mod version for history/undo functionality
     */
    createModVersion(modId: string, version: string, content: ModContent): Promise<ModVersion>;
    /**
     * Get mod versions
     */
    getModVersions(modId: string): Promise<ModVersion[]>;
    /**
     * Warehouse content for undo/history
     */
    warehouseContent(userId: string, modId: string, contentType: 'mod' | 'version' | 'history', content: any): Promise<ContentWarehouse>;
    /**
     * Get warehouse content for undo/history
     */
    getWarehouseContent(userId: string, modId: string, contentType?: 'mod' | 'version' | 'history'): Promise<ContentWarehouse[]>;
    /**
     * Ensure we're authenticated
     */
    private ensureAuthenticated;
    /**
     * Map dotCMS content to ModContent
     */
    private mapDotCMSContentToMod;
}
/**
 * Initialize dotCMS service with configuration
 */
export declare const initializeDotCMSService: (config: DotCMSConfig) => DotCMSService;
/**
 * Mock dotCMS service for development
 */
export declare class MockDotCMSService extends DotCMSService {
    private mockMods;
    private mockVersions;
    private mockWarehouse;
    constructor();
    authenticate(): Promise<boolean>;
    createMod(mod: ModContent): Promise<ModContent>;
    getMod(id: string): Promise<ModContent | null>;
    updateMod(id: string, mod: Partial<ModContent>): Promise<ModContent>;
    deleteMod(id: string): Promise<boolean>;
    getUserMods(userId: string): Promise<ModContent[]>;
    createModVersion(modId: string, version: string, content: ModContent): Promise<ModVersion>;
    getModVersions(modId: string): Promise<ModVersion[]>;
    warehouseContent(userId: string, modId: string, contentType: 'mod' | 'version' | 'history', content: any): Promise<ContentWarehouse>;
    getWarehouseContent(userId: string, modId: string, contentType?: 'mod' | 'version' | 'history'): Promise<ContentWarehouse[]>;
}
