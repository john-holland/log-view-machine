/**
 * Token Ledger Service
 *
 * Manages token transactions, balances, and blockchain mirroring.
 * Supports future migration to different blockchains (Solana, Ethereum, Bitcoin, Golem).
 */
export interface TokenTransaction {
    id: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    transactionType: 'donation' | 'mod_install' | 'mod_uninstall' | 'grant' | 'payout' | 'refund';
    reason: string;
    blockchainTxHash?: string;
    lockedUntil?: string;
    createdAt: string;
    status: 'pending' | 'completed' | 'failed' | 'locked';
}
export interface TokenBalance {
    userId: string;
    availableBalance: number;
    lockedBalance: number;
    totalBalance: number;
    lastUpdated: string;
}
export interface BlockchainMirror {
    id: string;
    ledgerId: string;
    blockchain: 'solana' | 'ethereum' | 'bitcoin' | 'golem';
    txHash: string;
    blockNumber?: number;
    syncedAt: string;
    status: 'pending' | 'confirmed' | 'failed';
}
export interface TokenLedgerStats {
    totalTransactions: number;
    totalTokensInCirculation: number;
    totalDonations: number;
    totalModEarnings: number;
    averageTransactionAmount: number;
    blockchainSyncStatus: {
        solana: number;
        ethereum: number;
        bitcoin: number;
        golem: number;
    };
}
export interface ModInstallTransaction {
    userId: string;
    modId: string;
    authorId: string;
    tokenAmount: number;
    installDate: string;
    lockDuration: number;
}
export declare class TokenLedgerService {
    private transactions;
    private balances;
    private blockchainMirror;
    private modInstalls;
    constructor();
    /**
     * Grant tokens to a user
     */
    grantTokens(userId: string, amount: number, source: 'donation' | 'admin_grant' | 'payout', reason: string): Promise<TokenTransaction>;
    /**
     * Transfer tokens between users (mod install)
     */
    transferTokens(fromUserId: string, toUserId: string, amount: number, reason: string, transactionType?: 'mod_install' | 'mod_uninstall'): Promise<TokenTransaction>;
    /**
     * Lock tokens for mod uninstall (2-week stickiness)
     */
    lockTokens(userId: string, amount: number, unlockDate: string, reason: string): Promise<TokenTransaction>;
    /**
     * Get user token balance
     */
    getBalance(userId: string): Promise<TokenBalance>;
    /**
     * Get transaction history for user
     */
    getTransactionHistory(userId: string, limit?: number, transactionType?: string): Promise<TokenTransaction[]>;
    /**
     * Process mod install with token transfer
     */
    processModInstall(userId: string, modId: string, authorId: string, tokenAmount: number): Promise<{
        transaction: TokenTransaction;
        installRecord: ModInstallTransaction;
    }>;
    /**
     * Process mod uninstall with token lock
     */
    processModUninstall(userId: string, modId: string): Promise<TokenTransaction>;
    /**
     * Check for expired token locks and release them
     */
    processExpiredLocks(): Promise<TokenTransaction[]>;
    /**
     * Get ledger statistics
     */
    getLedgerStats(): Promise<TokenLedgerStats>;
    /**
     * Mirror transaction to blockchain
     */
    private mirrorToBlockchain;
    /**
     * Update user balance
     */
    private updateBalance;
    /**
     * Update locked balance
     */
    private updateLockedBalance;
    /**
     * Initialize mock data for development
     */
    private initializeMockData;
}
/**
 * Initialize token ledger service
 */
export declare const initializeTokenLedgerService: () => TokenLedgerService;
