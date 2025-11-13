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
        solana: number; // percentage synced
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
    lockDuration: number; // days
}

export class TokenLedgerService {
    private transactions: Map<string, TokenTransaction> = new Map();
    private balances: Map<string, TokenBalance> = new Map();
    private blockchainMirror: Map<string, BlockchainMirror> = new Map();
    private modInstalls: Map<string, ModInstallTransaction> = new Map();

    constructor() {
        this.initializeMockData();
    }

    /**
     * Grant tokens to a user
     */
    async grantTokens(
        userId: string, 
        amount: number, 
        source: 'donation' | 'admin_grant' | 'payout',
        reason: string
    ): Promise<TokenTransaction> {
        const transaction: TokenTransaction = {
            id: `tx-${Date.now()}`,
            fromUserId: 'system',
            toUserId: userId,
            amount,
            transactionType: source === 'donation' ? 'donation' : 'grant',
            reason,
            createdAt: new Date().toISOString(),
            status: 'completed'
        };

        this.transactions.set(transaction.id, transaction);
        await this.updateBalance(userId, amount);
        await this.mirrorToBlockchain(transaction);

        return transaction;
    }

    /**
     * Transfer tokens between users (mod install)
     */
    async transferTokens(
        fromUserId: string,
        toUserId: string,
        amount: number,
        reason: string,
        transactionType: 'mod_install' | 'mod_uninstall' = 'mod_install'
    ): Promise<TokenTransaction> {
        // Check if user has sufficient balance
        const fromBalance = await this.getBalance(fromUserId);
        if (fromBalance.availableBalance < amount) {
            throw new Error('Insufficient token balance');
        }

        const transaction: TokenTransaction = {
            id: `tx-${Date.now()}`,
            fromUserId,
            toUserId,
            amount,
            transactionType,
            reason,
            createdAt: new Date().toISOString(),
            status: 'completed'
        };

        this.transactions.set(transaction.id, transaction);
        
        // Update balances
        await this.updateBalance(fromUserId, -amount);
        await this.updateBalance(toUserId, amount);
        
        await this.mirrorToBlockchain(transaction);

        return transaction;
    }

    /**
     * Lock tokens for mod uninstall (2-week stickiness)
     */
    async lockTokens(
        userId: string,
        amount: number,
        unlockDate: string,
        reason: string
    ): Promise<TokenTransaction> {
        const transaction: TokenTransaction = {
            id: `tx-${Date.now()}`,
            fromUserId: userId,
            toUserId: 'system',
            amount,
            transactionType: 'mod_uninstall',
            reason,
            lockedUntil: unlockDate,
            createdAt: new Date().toISOString(),
            status: 'locked'
        };

        this.transactions.set(transaction.id, transaction);
        await this.updateLockedBalance(userId, amount);

        return transaction;
    }

    /**
     * Get user token balance
     */
    async getBalance(userId: string): Promise<TokenBalance> {
        const balance = this.balances.get(userId);
        if (!balance) {
            // Initialize balance for new user
            const newBalance: TokenBalance = {
                userId,
                availableBalance: 0,
                lockedBalance: 0,
                totalBalance: 0,
                lastUpdated: new Date().toISOString()
            };
            this.balances.set(userId, newBalance);
            return newBalance;
        }
        return balance;
    }

    /**
     * Get transaction history for user
     */
    async getTransactionHistory(
        userId: string, 
        limit: number = 50,
        transactionType?: string
    ): Promise<TokenTransaction[]> {
        let transactions = Array.from(this.transactions.values())
            .filter(tx => tx.fromUserId === userId || tx.toUserId === userId);

        if (transactionType) {
            transactions = transactions.filter(tx => tx.transactionType === transactionType);
        }

        return transactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }

    /**
     * Process mod install with token transfer
     */
    async processModInstall(
        userId: string,
        modId: string,
        authorId: string,
        tokenAmount: number
    ): Promise<{ transaction: TokenTransaction; installRecord: ModInstallTransaction }> {
        // Transfer tokens to author
        const transaction = await this.transferTokens(
            userId,
            authorId,
            tokenAmount,
            `Mod install: ${modId}`,
            'mod_install'
        );

        // Create install record
        const installRecord: ModInstallTransaction = {
            userId,
            modId,
            authorId,
            tokenAmount,
            installDate: new Date().toISOString(),
            lockDuration: 14 // 2 weeks
        };

        this.modInstalls.set(`${userId}-${modId}`, installRecord);

        return { transaction, installRecord };
    }

    /**
     * Process mod uninstall with token lock
     */
    async processModUninstall(
        userId: string,
        modId: string
    ): Promise<TokenTransaction> {
        const installRecord = this.modInstalls.get(`${userId}-${modId}`);
        if (!installRecord) {
            throw new Error('Mod install record not found');
        }

        // Calculate lock duration (2 weeks from now)
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + 14);

        // Lock tokens
        const transaction = await this.lockTokens(
            userId,
            installRecord.tokenAmount,
            unlockDate.toISOString(),
            `Mod uninstall lock: ${modId}`
        );

        // Remove install record
        this.modInstalls.delete(`${userId}-${modId}`);

        return transaction;
    }

    /**
     * Check for expired token locks and release them
     */
    async processExpiredLocks(): Promise<TokenTransaction[]> {
        const now = new Date();
        const expiredTransactions: TokenTransaction[] = [];

        // Find expired locked transactions
        for (const [id, transaction] of this.transactions) {
            if (transaction.status === 'locked' && transaction.lockedUntil) {
                const unlockDate = new Date(transaction.lockedUntil);
                if (now >= unlockDate) {
                    // Release 50% back to user, 50% stays with author
                    const returnAmount = Math.floor(transaction.amount * 0.5);
                    const keepAmount = transaction.amount - returnAmount;

                    // Update transaction status
                    transaction.status = 'completed';

                    // Return portion to user
                    if (returnAmount > 0) {
                        await this.updateBalance(transaction.fromUserId, returnAmount);
                        
                        // Create refund transaction
                        const refundTx: TokenTransaction = {
                            id: `tx-${Date.now()}`,
                            fromUserId: 'system',
                            toUserId: transaction.fromUserId,
                            amount: returnAmount,
                            transactionType: 'refund',
                            reason: `Token lock expired: ${transaction.reason}`,
                            createdAt: new Date().toISOString(),
                            status: 'completed'
                        };
                        this.transactions.set(refundTx.id, refundTx);
                        expiredTransactions.push(refundTx);
                    }

                    // Keep portion with author (already transferred)
                    if (keepAmount > 0) {
                        const keepTx: TokenTransaction = {
                            id: `tx-${Date.now()}`,
                            fromUserId: 'system',
                            toUserId: transaction.toUserId,
                            amount: keepAmount,
                            transactionType: 'payout',
                            reason: `Author retention: ${transaction.reason}`,
                            createdAt: new Date().toISOString(),
                            status: 'completed'
                        };
                        this.transactions.set(keepTx.id, keepTx);
                        expiredTransactions.push(keepTx);
                    }
                }
            }
        }

        return expiredTransactions;
    }

    /**
     * Get ledger statistics
     */
    async getLedgerStats(): Promise<TokenLedgerStats> {
        const transactions = Array.from(this.transactions.values());
        const balances = Array.from(this.balances.values());

        const totalTransactions = transactions.length;
        const totalTokensInCirculation = balances.reduce((sum, balance) => sum + balance.totalBalance, 0);
        
        const donations = transactions.filter(tx => tx.transactionType === 'donation');
        const totalDonations = donations.reduce((sum, tx) => sum + tx.amount, 0);
        
        const modEarnings = transactions.filter(tx => tx.transactionType === 'mod_install');
        const totalModEarnings = modEarnings.reduce((sum, tx) => sum + tx.amount, 0);
        
        const averageTransactionAmount = totalTransactions > 0 
            ? transactions.reduce((sum, tx) => sum + tx.amount, 0) / totalTransactions 
            : 0;

        return {
            totalTransactions,
            totalTokensInCirculation,
            totalDonations,
            totalModEarnings,
            averageTransactionAmount,
            blockchainSyncStatus: {
                solana: 95, // Mock sync percentages
                ethereum: 0,
                bitcoin: 0,
                golem: 0
            }
        };
    }

    /**
     * Mirror transaction to blockchain
     */
    private async mirrorToBlockchain(transaction: TokenTransaction): Promise<void> {
        // For now, just create a mock blockchain mirror entry
        const mirror: BlockchainMirror = {
            id: `mirror-${transaction.id}`,
            ledgerId: transaction.id,
            blockchain: 'solana', // Default to Solana
            txHash: `mock-tx-${Date.now()}`,
            blockNumber: Math.floor(Math.random() * 1000000),
            syncedAt: new Date().toISOString(),
            status: 'confirmed'
        };

        this.blockchainMirror.set(mirror.id, mirror);
    }

    /**
     * Update user balance
     */
    private async updateBalance(userId: string, amount: number): Promise<void> {
        const balance = await this.getBalance(userId);
        balance.availableBalance += amount;
        balance.totalBalance = balance.availableBalance + balance.lockedBalance;
        balance.lastUpdated = new Date().toISOString();
        this.balances.set(userId, balance);
    }

    /**
     * Update locked balance
     */
    private async updateLockedBalance(userId: string, amount: number): Promise<void> {
        const balance = await this.getBalance(userId);
        balance.lockedBalance += amount;
        balance.totalBalance = balance.availableBalance + balance.lockedBalance;
        balance.lastUpdated = new Date().toISOString();
        this.balances.set(userId, balance);
    }

    /**
     * Initialize mock data for development
     */
    private initializeMockData(): void {
        // Mock user balances
        const mockBalances: TokenBalance[] = [
            {
                userId: 'user1',
                availableBalance: 150,
                lockedBalance: 25,
                totalBalance: 175,
                lastUpdated: new Date().toISOString()
            },
            {
                userId: 'user2',
                availableBalance: 75,
                lockedBalance: 0,
                totalBalance: 75,
                lastUpdated: new Date().toISOString()
            },
            {
                userId: 'author1',
                availableBalance: 500,
                lockedBalance: 0,
                totalBalance: 500,
                lastUpdated: new Date().toISOString()
            }
        ];

        mockBalances.forEach(balance => {
            this.balances.set(balance.userId, balance);
        });

        // Mock transactions
        const mockTransactions: TokenTransaction[] = [
            {
                id: 'tx-1',
                fromUserId: 'system',
                toUserId: 'user1',
                amount: 100,
                transactionType: 'donation',
                reason: 'Donation to developer portfolio',
                createdAt: '2024-01-15T10:00:00Z',
                status: 'completed'
            },
            {
                id: 'tx-2',
                fromUserId: 'user1',
                toUserId: 'author1',
                amount: 5,
                transactionType: 'mod_install',
                reason: 'Mod install: Dark Theme for Wave Tabs',
                createdAt: '2024-01-15T11:00:00Z',
                status: 'completed'
            },
            {
                id: 'tx-3',
                fromUserId: 'user2',
                toUserId: 'author1',
                amount: 10,
                transactionType: 'mod_install',
                reason: 'Mod install: Enhanced Selector Hierarchy',
                createdAt: '2024-01-16T09:00:00Z',
                status: 'completed'
            }
        ];

        mockTransactions.forEach(transaction => {
            this.transactions.set(transaction.id, transaction);
        });
    }
}

/**
 * Initialize token ledger service
 */
export const initializeTokenLedgerService = (): TokenLedgerService => {
    return new TokenLedgerService();
};
