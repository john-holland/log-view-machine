import { createTastyFishBurgerCart } from '../examples/TastyFishBurgerCartMachine';

// Mock server-side rendering function
const renderPriceDisplay = (items: any[], total: number, showTax: boolean = true, taxRate: number = 0.08) => {
    const tax = showTax ? total * taxRate : 0;
    const finalTotal = total + tax;
    
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ Price Information (Server-Side Rendered) • Live         │');
    console.log('├─────────────────────────────────────────────────────────┤');
    
    if (items.length === 0) {
        console.log('│ No items in cart                                        │');
    } else {
        items.forEach((item) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            const itemName = `${item.name} (x${item.quantity})`;
            const padding = ' '.repeat(Math.max(0, 35 - itemName.length));
            console.log(`│ ${itemName}${padding}$${itemTotal} │`);
        });
    }
    
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ Subtotal${' '.repeat(35)}$${total.toFixed(2)} │`);
    
    if (showTax) {
        console.log(`│ Tax (${(taxRate * 100).toFixed(1)}%)${' '.repeat(30)}$${tax.toFixed(2)} │`);
    }
    
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│ Total${' '.repeat(37)}$${finalTotal.toFixed(2)} │`);
    console.log('└─────────────────────────────────────────────────────────┘');
};

// Simulate server-side polling
const simulateServerPolling = (cartMachine: any, intervalMs: number = 3000) => {
    console.log(`\n🔄 Starting server-side polling every ${intervalMs}ms...`);
    
    const pollInterval = setInterval(() => {
        const viewModel = cartMachine.getViewModel();
        console.log(`\n📡 Server poll at ${new Date().toLocaleTimeString()}:`);
        renderPriceDisplay(viewModel.items, viewModel.total);
    }, intervalMs);
    
    return () => {
        clearInterval(pollInterval);
        console.log('\n⏹️  Server polling stopped');
    };
};

// Main demonstration function
export const runServerSideRenderedDemo = async () => {
    console.log('🚀 Server-Side Rendered ViewMachine Demo');
    console.log('==========================================\n');
    
    // Create the cart machine
    const cartMachine = createTastyFishBurgerCart({ cartId: 'demo-cart-1' });
    
    // Start server polling
    const stopPolling = simulateServerPolling(cartMachine, 3000);
    
    // Simulate user interactions
    const simulateUserFlow = async () => {
        try {
            console.log('\n👤 User: Adding Classic Fish Burger...');
            await cartMachine.send('addItem', '1');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Adding Spicy Fish Burger...');
            await cartMachine.send('addItem', '2');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Adding another Classic Fish Burger...');
            await cartMachine.send('addItem', '1');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Starting checkout...');
            await cartMachine.send('checkout');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Completing payment...');
            await cartMachine.send('handlePaymentSuccess');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Starting new order...');
            await cartMachine.send('startNewOrder');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error('❌ Error in user flow:', error);
        }
    };
    
    // Run the simulation
    await simulateUserFlow();
    
    // Stop polling after simulation
    setTimeout(() => {
        stopPolling();
        console.log('\n✅ Demo completed!');
    }, 2000);
};

// Example of how to create a server-side rendered view machine
export class ServerSideRenderedViewMachine {
    private cartMachine: any;
    private serverEndpoint?: string;
    private pollingInterval: number;
    private pollingTimer?: NodeJS.Timeout;
    
    constructor(cartMachine: any, config: { serverEndpoint?: string; pollingInterval?: number } = {}) {
        this.cartMachine = cartMachine;
        this.serverEndpoint = config.serverEndpoint;
        this.pollingInterval = config.pollingInterval || 5000;
        
        if (this.serverEndpoint) {
            this.startPolling();
        }
    }
    
    private startPolling(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
        
        this.pollingTimer = setInterval(async () => {
            try {
                await this.syncWithServer();
            } catch (error) {
                console.error('Failed to sync with server:', error);
            }
        }, this.pollingInterval);
    }
    
    private async syncWithServer(): Promise<void> {
        if (!this.serverEndpoint) return;
        
        try {
            // In a real implementation, this would fetch from the server
            const mockServerResponse = {
                viewModel: this.cartMachine.getViewModel(),
                timestamp: new Date().toISOString(),
                serverId: 'server-1'
            };
            
            console.log('🔄 Syncing with server:', mockServerResponse);
            
            // Update the view model with server data
            // In a real implementation, this would update the cart machine
            // this.cartMachine.updateFromServerData(mockServerResponse.viewModel);
            
        } catch (error) {
            console.error('Server sync failed:', error);
        }
    }
    
    public renderPriceDisplay(): void {
        const viewModel = this.cartMachine.getViewModel();
        renderPriceDisplay(viewModel.items, viewModel.total);
    }
    
    public destroy(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
    }
    
    public setServerEndpoint(endpoint: string): void {
        this.serverEndpoint = endpoint;
        this.startPolling();
    }
}

// Example usage
if (require.main === module) {
    runServerSideRenderedDemo().catch(console.error);
} 