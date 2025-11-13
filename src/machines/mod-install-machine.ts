/**
 * Mod Install Machine
 * 
 * State machine for handling mod installation, uninstallation, and token transfers.
 * Integrates with token ledger service and mod review system.
 */

import { createViewStateMachine, MachineRouter } from 'log-view-machine';
import { TokenLedgerService } from '../services/token-ledger-service';
import { ModReviewService } from '../services/mod-review-service';

type ServiceMeta = { 
    routedSend?: (target: string, event: string, data?: any) => Promise<any>; 
};

export interface ModInstallContext {
    userId: string;
    modId: string;
    authorId: string;
    tokenAmount: number;
    installStatus: 'idle' | 'checking_balance' | 'transferring_tokens' | 'installing' | 'active' | 'uninstalling' | 'locking_tokens' | 'inactive';
    error?: string;
    transactionId?: string;
    lockExpiryDate?: string;
    installRecord?: any;
}

export const createModInstallMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'mod-install-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            id: 'mod-install-machine',
            initial: 'idle',
            context: {
                userId: '',
                modId: '',
                authorId: '',
                tokenAmount: 0,
                installStatus: 'idle',
                error: undefined,
                transactionId: undefined,
                lockExpiryDate: undefined,
                installRecord: undefined
            } as ModInstallContext,
            states: {
                idle: {
                    on: {
                        INSTALL_MOD: {
                            target: 'checking_balance',
                            actions: 'setInstallData'
                        },
                        UNINSTALL_MOD: {
                            target: 'uninstalling',
                            actions: 'setUninstallData'
                        }
                    }
                },
                checking_balance: {
                    invoke: {
                        id: 'checkBalanceService',
                        src: 'checkBalanceService',
                        onDone: {
                            target: 'transferring_tokens',
                            actions: 'setBalanceChecked'
                        },
                        onError: {
                            target: 'idle',
                            actions: 'setError'
                        }
                    }
                },
                transferring_tokens: {
                    invoke: {
                        id: 'transferTokensService',
                        src: 'transferTokensService',
                        onDone: {
                            target: 'installing',
                            actions: 'setTokensTransferred'
                        },
                        onError: {
                            target: 'idle',
                            actions: 'setError'
                        }
                    }
                },
                installing: {
                    invoke: {
                        id: 'installModService',
                        src: 'installModService',
                        onDone: {
                            target: 'active',
                            actions: 'setModInstalled'
                        },
                        onError: {
                            target: 'idle',
                            actions: 'setError'
                        }
                    }
                },
                active: {
                    on: {
                        UNINSTALL_MOD: {
                            target: 'uninstalling',
                            actions: 'setUninstallData'
                        },
                        CHECK_LOCK_STATUS: {
                            target: 'checking_lock_status'
                        }
                    }
                },
                checking_lock_status: {
                    invoke: {
                        id: 'checkLockStatusService',
                        src: 'checkLockStatusService',
                        onDone: {
                            target: 'active',
                            actions: 'setLockStatus'
                        },
                        onError: {
                            target: 'active',
                            actions: 'setError'
                        }
                    }
                },
                uninstalling: {
                    invoke: {
                        id: 'uninstallModService',
                        src: 'uninstallModService',
                        onDone: {
                            target: 'locking_tokens',
                            actions: 'setModUninstalled'
                        },
                        onError: {
                            target: 'active',
                            actions: 'setError'
                        }
                    }
                },
                locking_tokens: {
                    invoke: {
                        id: 'lockTokensService',
                        src: 'lockTokensService',
                        onDone: {
                            target: 'inactive',
                            actions: 'setTokensLocked'
                        },
                        onError: {
                            target: 'active',
                            actions: 'setError'
                        }
                    }
                },
                inactive: {
                    on: {
                        INSTALL_MOD: {
                            target: 'checking_balance',
                            actions: 'setInstallData'
                        }
                    }
                }
            }
        },
        services: {
            checkBalanceService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    // Check if user has sufficient token balance
                    const tokenLedger = new TokenLedgerService();
                    const balance = await tokenLedger.getBalance(context.userId);
                    
                    if (balance.availableBalance < context.tokenAmount) {
                        throw new Error(`Insufficient balance. Required: ${context.tokenAmount}, Available: ${balance.availableBalance}`);
                    }
                    
                    return { 
                        sufficientBalance: true, 
                        availableBalance: balance.availableBalance 
                    };
                } catch (error: any) {
                    throw new Error(`Balance check failed: ${error.message}`);
                }
            },
            
            transferTokensService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    const tokenLedger = new TokenLedgerService();
                    const transaction = await tokenLedger.transferTokens(
                        context.userId,
                        context.authorId,
                        context.tokenAmount,
                        `Mod install: ${context.modId}`,
                        'mod_install'
                    );
                    
                    return { 
                        transactionId: transaction.id,
                        transaction 
                    };
                } catch (error: any) {
                    throw new Error(`Token transfer failed: ${error.message}`);
                }
            },
            
            installModService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    // Create install record
                    const installRecord = {
                        userId: context.userId,
                        modId: context.modId,
                        authorId: context.authorId,
                        tokenAmount: context.tokenAmount,
                        installDate: new Date().toISOString(),
                        lockDuration: 14 // 2 weeks
                    };
                    
                    // In a real implementation, this would:
                    // 1. Download mod files
                    // 2. Install mod in user's environment
                    // 3. Update mod install count
                    // 4. Send notification to author
                    
                    return { 
                        installRecord,
                        installSuccess: true 
                    };
                } catch (error: any) {
                    throw new Error(`Mod installation failed: ${error.message}`);
                }
            },
            
            uninstallModService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    // In a real implementation, this would:
                    // 1. Remove mod files
                    // 2. Restore original component
                    // 3. Update mod install count
                    // 4. Send notification to author
                    
                    return { 
                        uninstallSuccess: true,
                        uninstallDate: new Date().toISOString()
                    };
                } catch (error: any) {
                    throw new Error(`Mod uninstallation failed: ${error.message}`);
                }
            },
            
            lockTokensService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    const tokenLedger = new TokenLedgerService();
                    
                    // Calculate lock expiry date (2 weeks from now)
                    const unlockDate = new Date();
                    unlockDate.setDate(unlockDate.getDate() + 14);
                    
                    const transaction = await tokenLedger.lockTokens(
                        context.userId,
                        context.tokenAmount,
                        unlockDate.toISOString(),
                        `Mod uninstall lock: ${context.modId}`
                    );
                    
                    return { 
                        lockExpiryDate: unlockDate.toISOString(),
                        transactionId: transaction.id
                    };
                } catch (error: any) {
                    throw new Error(`Token locking failed: ${error.message}`);
                }
            },
            
            checkLockStatusService: async (context: ModInstallContext, event: any, meta: ServiceMeta) => {
                try {
                    const tokenLedger = new TokenLedgerService();
                    
                    // Check if there are any expired locks to process
                    const expiredTransactions = await tokenLedger.processExpiredLocks();
                    
                    return { 
                        expiredTransactions,
                        hasExpiredLocks: expiredTransactions.length > 0
                    };
                } catch (error: any) {
                    throw new Error(`Lock status check failed: ${error.message}`);
                }
            }
        },
        actions: {
            setInstallData: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    userId: event.userId,
                    modId: event.modId,
                    authorId: event.authorId,
                    tokenAmount: event.tokenAmount,
                    installStatus: 'checking_balance',
                    error: undefined
                };
            },
            
            setUninstallData: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    userId: event.userId,
                    modId: event.modId,
                    installStatus: 'uninstalling',
                    error: undefined
                };
            },
            
            setBalanceChecked: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    installStatus: 'transferring_tokens'
                };
            },
            
            setTokensTransferred: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    transactionId: event.data.transactionId,
                    installStatus: 'installing'
                };
            },
            
            setModInstalled: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    installRecord: event.data.installRecord,
                    installStatus: 'active'
                };
            },
            
            setModUninstalled: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    installStatus: 'locking_tokens'
                };
            },
            
            setTokensLocked: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    lockExpiryDate: event.data.lockExpiryDate,
                    installStatus: 'inactive'
                };
            },
            
            setLockStatus: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    installStatus: 'active'
                };
            },
            
            setError: (context: ModInstallContext, event: any) => {
                return {
                    ...context,
                    error: event.data?.message || 'Unknown error occurred',
                    installStatus: 'idle'
                };
            }
        }
    });
};
