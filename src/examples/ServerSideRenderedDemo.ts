import { createSimpleCart } from './SimpleCartMachine';

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
    const cartMachine = createSimpleCart({ cartId: 'demo-cart-1' });
    
    // Start server polling
    const stopPolling = simulateServerPolling(cartMachine, 3000);
    
    // Simulate user interactions
    const simulateUserFlow = async () => {
        try {
            console.log('\n👤 User: Adding Classic Fish Burger...');
            cartMachine.sendMessage('addItem');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Adding Spicy Fish Burger...');
            cartMachine.sendMessage('addItem');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Adding another Classic Fish Burger...');
            cartMachine.sendMessage('addItem');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Starting checkout...');
            cartMachine.sendMessage('checkout');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Completing payment...');
            cartMachine.sendMessage('handlePaymentSuccess');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('\n👤 User: Starting new order...');
            cartMachine.sendMessage('startNewOrder');
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

// Example usage
if (require.main === module) {
    runServerSideRenderedDemo().catch(console.error);
} 