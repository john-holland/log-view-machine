/**
 * Mod Install Machine
 *
 * State machine for handling mod installation, uninstallation, and token transfers.
 * Integrates with token ledger service and mod review system.
 */
import { MachineRouter } from 'log-view-machine';
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
export declare const createModInstallMachine: (router?: MachineRouter) => import("log-view-machine").ViewStateMachine<any>;
