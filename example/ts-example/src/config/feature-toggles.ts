import { Unleash, Context, Strategy } from 'unleash-client';
import { Redis } from 'ioredis';

// IP ban configuration
interface IPBanConfig {
    duration: number; // Duration in milliseconds
    maxAttempts: number;
}

// P2P connection configuration
interface P2PConfig {
    maxConnections: number;
    reductionThreshold: number;
    ghostThreshold: number;
}

// Feature toggle configuration
interface FeatureToggleConfig {
    name: string;
    description: string;
    enabled: boolean;
    strategies: {
        name: string;
        parameters: Record<string, string>;
    }[];
}

// IP ban store using Redis
class IPBanStore {
    public redis: Redis;
    private config: IPBanConfig;

    constructor(redisUrl: string, config: IPBanConfig) {
        this.redis = new Redis(redisUrl);
        this.config = config;
    }

    async isBanned(ip: string): Promise<boolean> {
        const attempts = await this.redis.get(`ip:${ip}:attempts`);
        return attempts ? parseInt(attempts) >= this.config.maxAttempts : false;
    }

    async recordAttempt(ip: string): Promise<void> {
        const key = `ip:${ip}:attempts`;
        const current = await this.redis.get(key);
        const attempts = current ? parseInt(current) + 1 : 1;
        
        await this.redis.set(key, attempts, 'PX', this.config.duration);
    }

    async resetAttempts(ip: string): Promise<void> {
        await this.redis.del(`ip:${ip}:attempts`);
    }

    async setTimedBan(ip: string, duration: number): Promise<void> {
        await this.redis.set(`ip:${ip}:timed-ban`, '1', 'PX', duration);
    }

    async isTimedBanned(ip: string): Promise<boolean> {
        return !!(await this.redis.get(`ip:${ip}:timed-ban`));
    }
}

// P2P connection store
class P2PStore {
    public redis: Redis;
    public config: P2PConfig;

    constructor(redisUrl: string, config: P2PConfig) {
        this.redis = new Redis(redisUrl);
        this.config = config;
    }

    async getConnectionCount(ip: string): Promise<number> {
        const count = await this.redis.get(`p2p:${ip}:connections`);
        return count ? parseInt(count) : 0;
    }

    async incrementConnections(ip: string): Promise<number> {
        const count = await this.redis.incr(`p2p:${ip}:connections`);
        await this.redis.expire(`p2p:${ip}:connections`, 3600); // 1 hour expiry
        return count;
    }

    async decrementConnections(ip: string): Promise<number> {
        const count = await this.redis.decr(`p2p:${ip}:connections`);
        if (count <= 0) {
            await this.redis.del(`p2p:${ip}:connections`);
            return 0;
        }
        return count;
    }

    async getGhostedHosts(ip: string): Promise<string[]> {
        const hosts = await this.redis.smembers(`p2p:${ip}:ghosted`);
        return hosts;
    }

    async addGhostedHost(ip: string, hostId: string): Promise<void> {
        await this.redis.sadd(`p2p:${ip}:ghosted`, hostId);
    }

    async removeGhostedHost(ip: string, hostId: string): Promise<void> {
        await this.redis.srem(`p2p:${ip}:ghosted`, hostId);
    }
}

// Initialize Unleash client
const unleash = new Unleash({
    appName: 'fishburger-api',
    url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
    apiKey: process.env.UNLEASH_API_KEY || 'default:development.unleash-insecure-api-token',
    refreshInterval: 15000,
    metricsInterval: 60000,
    disableMetrics: process.env.NODE_ENV === 'development',
});

// Initialize stores
const ipBanStore = new IPBanStore(
    process.env.REDIS_URL || 'redis://localhost:6379',
    {
        duration: 3600000, // 1 hour
        maxAttempts: 5
    }
);

const p2pStore = new P2PStore(
    process.env.REDIS_URL || 'redis://localhost:6379',
    {
        maxConnections: 100,
        reductionThreshold: 50,
        ghostThreshold: 100
    }
);

// Feature toggle definitions
export const featureToggles: Record<string, FeatureToggleConfig> = {
    tracing: {
        name: 'enable-tracing',
        description: 'Enable OpenTelemetry tracing',
        enabled: true,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    metrics: {
        name: 'enable-metrics',
        description: 'Enable metrics collection',
        enabled: true,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    ipBanning: {
        name: 'enable-ip-banning',
        description: 'Enable IP banning for failed attempts',
        enabled: true,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    timedBanning: {
        name: 'enable-timed-banning',
        description: 'Enable time-based IP banning',
        enabled: true,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    p2pManagement: {
        name: 'enable-p2p-management',
        description: 'Enable P2P connection management',
        enabled: true,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    banAppeal: {
        name: 'enable-ban-appeal',
        description: 'Enable ban appeal system for events',
        enabled: false,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    },
    datadog: {
        name: 'enable-datadog',
        description: 'Enable DataDog integration',
        enabled: false,
        strategies: [
            {
                name: 'default',
                parameters: {}
            }
        ]
    }
};

// Initialize feature toggles
export async function initializeFeatureToggles(): Promise<void> {
    await unleash.start();
    
    // Register custom strategies
    unleash.addStrategy({
        name: 'ip-ban',
        execute: async (parameters: Record<string, string>, context: Context): Promise<boolean> => {
            if (!context.remoteAddress) return false;
            
            const isBanned = await ipBanStore.isBanned(context.remoteAddress);
            if (isBanned) return false;
            
            if (parameters.recordAttempt === 'true') {
                await ipBanStore.recordAttempt(context.remoteAddress);
            }
            
            return true;
        }
    });

    unleash.addStrategy({
        name: 'timed-ban',
        execute: async (parameters: Record<string, string>, context: Context): Promise<boolean> => {
            if (!context.remoteAddress) return false;
            return !(await ipBanStore.isTimedBanned(context.remoteAddress));
        }
    });

    unleash.addStrategy({
        name: 'p2p-limit',
        execute: async (parameters: Record<string, string>, context: Context): Promise<boolean> => {
            if (!context.remoteAddress) return false;
            
            const count = await p2pStore.getConnectionCount(context.remoteAddress);
            if (count >= p2pStore.config.ghostThreshold) {
                return false;
            }
            
            if (count >= p2pStore.config.reductionThreshold) {
                const reduction = Math.floor((count - p2pStore.config.reductionThreshold) / 
                    (p2pStore.config.ghostThreshold - p2pStore.config.reductionThreshold) * 100);
                return Math.random() * 100 > reduction;
            }
            
            return true;
        }
    });
}

// Check if a feature is enabled
export function isFeatureEnabled(name: string, context?: Record<string, string>): boolean {
    return unleash.isEnabled(name, context);
}

// Record a failed attempt for IP banning
export async function recordFailedAttempt(ip: string): Promise<void> {
    if (isFeatureEnabled('enable-ip-banning')) {
        await ipBanStore.recordAttempt(ip);
    }
}

// Set a timed ban
export async function setTimedBan(ip: string, duration: number): Promise<void> {
    if (isFeatureEnabled('enable-timed-banning')) {
        await ipBanStore.setTimedBan(ip, duration);
    }
}

// P2P connection management
export async function handleP2PConnection(ip: string, hostId: string): Promise<{
    allowed: boolean;
    ghosted: boolean;
    message?: string;
}> {
    if (!isFeatureEnabled('enable-p2p-management')) {
        return { allowed: true, ghosted: false };
    }

    const count = await p2pStore.incrementConnections(ip);
    
    if (count >= p2pStore.config.ghostThreshold) {
        await p2pStore.addGhostedHost(ip, hostId);
        return {
            allowed: false,
            ghosted: true,
            message: "1 may make it through, to test the rest... but don't be a pest!"
        };
    }

    if (count >= p2pStore.config.reductionThreshold) {
        const reduction = Math.floor((count - p2pStore.config.reductionThreshold) / 
            (p2pStore.config.ghostThreshold - p2pStore.config.reductionThreshold) * 100);
        
        if (Math.random() * 100 <= reduction) {
            await p2pStore.addGhostedHost(ip, hostId);
            return {
                allowed: true,
                ghosted: true,
                message: "You've been ghosted due to high connection count"
            };
        }
    }

    return { allowed: true, ghosted: false };
}

// Reset failed attempts for an IP
export async function resetFailedAttempts(ip: string): Promise<void> {
    await ipBanStore.resetAttempts(ip);
}

// Cleanup
export async function destroyFeatureToggles(): Promise<void> {
    await unleash.destroy();
    await ipBanStore.redis.quit();
    await p2pStore.redis.quit();
} 