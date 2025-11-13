/**
 * Solana SPL Token Service
 *
 * Handles Solana blockchain integration for Wave Reader tokens.
 * Supports wallet connection, token transfers, and transaction monitoring.
 */
export interface SolanaConfig {
    network: 'devnet' | 'testnet' | 'mainnet';
    rpcUrl: string;
    programId: string;
    tokenMint: string;
}
export interface WalletConnection {
    publicKey: string;
    connected: boolean;
    walletType: 'phantom' | 'sollet' | 'solflare' | 'ledger';
}
export interface TokenAccount {
    address: string;
    mint: string;
    owner: string;
    amount: number;
    decimals: number;
}
export interface SolanaTransaction {
    signature: string;
    blockTime: number;
    slot: number;
    status: 'success' | 'failed';
    amount: number;
    from: string;
    to: string;
}
export interface SolanaTokenInfo {
    mint: string;
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
    totalSupply: number;
}
export declare class SolanaService {
    private config;
    private walletConnection;
    private phantom;
    constructor(config: SolanaConfig);
    /**
     * Initialize Phantom wallet connection
     */
    private initializePhantom;
    /**
     * Connect to Phantom wallet
     */
    connectWallet(): Promise<WalletConnection>;
    /**
     * Disconnect wallet
     */
    disconnectWallet(): Promise<void>;
    /**
     * Get wallet connection status
     */
    getWalletConnection(): WalletConnection | null;
    /**
     * Get token account info
     */
    getTokenAccount(owner: string): Promise<TokenAccount | null>;
    /**
     * Get token info
     */
    getTokenInfo(): Promise<SolanaTokenInfo>;
    /**
     * Transfer tokens
     */
    transferTokens(to: string, amount: number, memo?: string): Promise<SolanaTransaction>;
    /**
     * Get transaction history
     */
    getTransactionHistory(account: string, limit?: number): Promise<SolanaTransaction[]>;
    /**
     * Create token account for user
     */
    createTokenAccount(owner: string): Promise<TokenAccount>;
    /**
     * Mint tokens (admin only)
     */
    mintTokens(to: string, amount: number): Promise<SolanaTransaction>;
    /**
     * Burn tokens
     */
    burnTokens(amount: number): Promise<SolanaTransaction>;
    /**
     * Get network status
     */
    getNetworkStatus(): Promise<{
        connected: boolean;
        network: string;
        blockHeight: number;
        slot: number;
    }>;
    /**
     * Estimate transaction fees
     */
    estimateFees(transactionType: 'transfer' | 'mint' | 'burn'): Promise<number>;
    /**
     * Validate wallet address
     */
    isValidAddress(address: string): boolean;
    /**
     * Convert lamports to tokens
     */
    lamportsToTokens(lamports: number, decimals?: number): number;
    /**
     * Convert tokens to lamports
     */
    tokensToLamports(tokens: number, decimals?: number): number;
}
/**
 * Initialize Solana service
 */
export declare const initializeSolanaService: (config: SolanaConfig) => SolanaService;
/**
 * Mock Solana service for development
 */
export declare class MockSolanaService extends SolanaService {
    private mockBalance;
    private mockTransactions;
    constructor();
    connectWallet(): Promise<WalletConnection>;
    getTokenAccount(owner: string): Promise<TokenAccount | null>;
    transferTokens(to: string, amount: number, memo?: string): Promise<SolanaTransaction>;
    getTransactionHistory(account: string, limit?: number): Promise<SolanaTransaction[]>;
}
