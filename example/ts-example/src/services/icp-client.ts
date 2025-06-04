import { Agent, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { LedgerCanister } from '@dfinity/ledger-icp';

interface PaymentRequest {
    amount: number;
    from: string;
    to: string;
    description: string;
}

interface PaymentResponse {
    success: boolean;
    transactionId?: string;
    error?: string;
}

export class ICPClient {
    private agent: Agent;
    private ledger: LedgerCanister;

    constructor(identity: any, host: string) {
        this.agent = new HttpAgent({
            identity,
            host
        });
        this.ledger = LedgerCanister.create({
            agent: this.agent,
            canisterId: Principal.fromText(process.env.ICP_LEDGER_CANISTER_ID || '')
        });
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const fromPrincipal = Principal.fromText(request.from);
            const toPrincipal = Principal.fromText(request.to);

            // Convert amount to e8s (ICP's smallest unit)
            const amountE8s = BigInt(Math.floor(request.amount * 100000000));

            // Create transfer
            const transferResult = await this.ledger.transfer({
                to: toPrincipal,
                amount: amountE8s,
                memo: BigInt(Date.now()), // Use timestamp as memo
                fee: BigInt(10000), // Standard fee
                from_subaccount: [], // Use default subaccount
                created_at_time: [] // Use current time
            });

            return {
                success: true,
                transactionId: transferResult.toString()
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getBalance(principal: string): Promise<number> {
        try {
            const balance = await this.ledger.accountBalance({
                account: Principal.fromText(principal)
            });
            // Convert from e8s to ICP
            return Number(balance) / 100000000;
        } catch (error) {
            throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getTransaction(transactionId: string): Promise<any> {
        try {
            const tx = await this.ledger.getTransaction({
                transactionId: BigInt(transactionId)
            });
            return tx;
        } catch (error) {
            throw new Error(`Failed to get transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 