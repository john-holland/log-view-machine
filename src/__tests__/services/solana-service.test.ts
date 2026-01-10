import { SolanaService, initializeSolanaService, SolanaConfig } from '../../services/solana-service';

describe('SolanaService', () => {
    let config: SolanaConfig;
    let service: SolanaService;

    beforeEach(() => {
        config = {
            network: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            programId: 'test-program-id',
            tokenMint: 'test-token-mint'
        };
        service = new SolanaService(config);
    });

    describe('Initialization', () => {
        it('should create a service instance', () => {
            expect(service).toBeDefined();
        });

        it('should initialize with provided config', () => {
            expect(service.getConfig()).toEqual(config);
        });

        it('should initialize wallet connection as null', () => {
            expect(service.getWalletConnection()).toBeNull();
        });

        it('should create service via initializeSolanaService', () => {
            const initialized = initializeSolanaService(config);
            expect(initialized).toBeInstanceOf(SolanaService);
            expect(initialized.getConfig()).toEqual(config);
        });
    });

    describe('Config Access', () => {
        it('should return config via getConfig()', () => {
            const retrievedConfig = service.getConfig();
            expect(retrievedConfig).toEqual(config);
            expect(retrievedConfig.network).toBe('devnet');
            expect(retrievedConfig.rpcUrl).toBe('https://api.devnet.solana.com');
            expect(retrievedConfig.programId).toBe('test-program-id');
            expect(retrievedConfig.tokenMint).toBe('test-token-mint');
        });

        it('should return config as readonly interface', () => {
            const retrievedConfig = service.getConfig();
            expect(retrievedConfig).toHaveProperty('network');
            expect(retrievedConfig).toHaveProperty('rpcUrl');
            expect(retrievedConfig).toHaveProperty('programId');
            expect(retrievedConfig).toHaveProperty('tokenMint');
        });
    });

    describe('Wallet Connection', () => {
        it('should return null when wallet not connected', () => {
            expect(service.getWalletConnection()).toBeNull();
        });

        it('should throw error when connecting without phantom wallet', async () => {
            // Mock window object to not have solana
            const originalWindow = global.window;
            (global as any).window = undefined;

            await expect(service.connectWallet()).rejects.toThrow('Phantom wallet not found');

            // Restore window
            global.window = originalWindow;
        });
    });

    describe('Token Account', () => {
        it('should throw error when getting token account without wallet connection', async () => {
            await expect(service.getTokenAccount('test-owner')).rejects.toThrow('Wallet not connected');
        });

        it('should return token account with correct mint from config', async () => {
            // Note: This would require mocking wallet connection, but demonstrates the pattern
            // In a real test, you'd mock the wallet connection first
        });
    });

    describe('Token Info', () => {
        it('should return token info with mint from config', async () => {
            const tokenInfo = await service.getTokenInfo();
            expect(tokenInfo).toBeDefined();
            expect(tokenInfo.mint).toBe(config.tokenMint);
            expect(tokenInfo.name).toBe('Wave Reader Token');
            expect(tokenInfo.symbol).toBe('WVR');
            expect(tokenInfo.decimals).toBe(9);
        });
    });

    describe('Network Status', () => {
        it('should return network status with network from config', async () => {
            const status = await service.getNetworkStatus();
            expect(status).toBeDefined();
            expect(status.network).toBe(config.network);
            expect(status.connected).toBe(true);
            expect(status).toHaveProperty('blockHeight');
            expect(status).toHaveProperty('slot');
        });
    });

    describe('Utility Methods', () => {
        it('should validate Solana addresses', () => {
            expect(service.isValidAddress('So11111111111111111111111111111111111111112')).toBe(true);
            expect(service.isValidAddress('invalid')).toBe(false);
            expect(service.isValidAddress('')).toBe(false);
        });

        it('should convert lamports to tokens', () => {
            expect(service.lamportsToTokens(1000000000, 9)).toBe(1);
            expect(service.lamportsToTokens(500000000, 9)).toBe(0.5);
            expect(service.lamportsToTokens(1000000000, 6)).toBe(1000);
        });

        it('should convert tokens to lamports', () => {
            expect(service.tokensToLamports(1, 9)).toBe(1000000000);
            expect(service.tokensToLamports(0.5, 9)).toBe(500000000);
            expect(service.tokensToLamports(1000, 6)).toBe(1000000000);
        });
    });

    describe('Transaction Methods', () => {
        it('should throw error when transferring without wallet connection', async () => {
            await expect(service.transferTokens('recipient', 100)).rejects.toThrow('Wallet not connected');
        });

        it('should throw error when minting without wallet connection', async () => {
            await expect(service.mintTokens('recipient', 100)).rejects.toThrow('Wallet not connected');
        });

        it('should throw error when burning without wallet connection', async () => {
            await expect(service.burnTokens(100)).rejects.toThrow('Wallet not connected');
        });

        it('should estimate transaction fees', async () => {
            const transferFee = await service.estimateFees('transfer');
            const mintFee = await service.estimateFees('mint');
            const burnFee = await service.estimateFees('burn');

            expect(transferFee).toBe(0.000005);
            expect(mintFee).toBe(0.00001);
            expect(burnFee).toBe(0.000005);
        });
    });
});

