import { createTastyFishBurgerCart } from './TastyFishBurgerCartMachine';
import { ServerSideRenderedPriceDisplay } from '../components/ServerSideRenderedPriceDisplay';

// Example of how to use ServerSideRenderedPriceDisplay with state machines
export const runServerSideRenderedExample = () => {
    console.log('=== Server-Side Rendered Price Display Example ===\n');

    // Create the cart machine
    const cartMachine = createTastyFishBurgerCart({ cartId: '1' });

    // Simulate adding items to cart
    const addItemsToCart = async () => {
        console.log('Adding items to cart...');
        
        try {
            await cartMachine.send('addItem', '1'); // Classic Fish Burger
            await cartMachine.send('addItem', '2'); // Spicy Fish Burger
            await cartMachine.send('addItem', '1'); // Another Classic Fish Burger
            
            console.log('Items added successfully!');
        } catch (error) {
            console.error('Error adding items:', error);
        }
    };

    // Get the current view model
    const getCurrentViewModel = () => {
        return cartMachine.getViewModel();
    };

    // Example of how the ServerSideRenderedPriceDisplay would receive data
    const simulateServerSideRendering = () => {
        const viewModel = getCurrentViewModel();
        
        console.log('Current Cart State:');
        console.log('- Status:', viewModel.status);
        console.log('- Items:', viewModel.items.length);
        console.log('- Total:', viewModel.total);
        
        console.log('\nServer-Side Rendered Price Display would show:');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ Price Information (Server-Side Rendered) • Live │');
        console.log('├─────────────────────────────────────────────┤');
        
        viewModel.items.forEach((item: any) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            console.log(`│ ${item.name} (x${item.quantity})${' '.repeat(20 - item.name.length)}$${itemTotal} │`);
        });
        
        console.log('├─────────────────────────────────────────────┤');
        console.log(`│ Subtotal${' '.repeat(30)}$${viewModel.total.toFixed(2)} │`);
        
        const tax = viewModel.total * 0.08;
        console.log(`│ Tax (8.0%)${' '.repeat(25)}$${tax.toFixed(2)} │`);
        
        const finalTotal = viewModel.total + tax;
        console.log('├─────────────────────────────────────────────┤');
        console.log(`│ Total${' '.repeat(32)}$${finalTotal.toFixed(2)} │`);
        console.log('└─────────────────────────────────────────────┘');
    };

    // Run the example
    const runExample = async () => {
        console.log('1. Initial state:');
        simulateServerSideRendering();
        
        console.log('\n2. Adding items...');
        await addItemsToCart();
        
        console.log('\n3. After adding items:');
        simulateServerSideRendering();
        
        console.log('\n4. Starting checkout...');
        await cartMachine.send('checkout');
        
        console.log('\n5. During checkout:');
        simulateServerSideRendering();
        
        console.log('\n6. Completing payment...');
        await cartMachine.send('handlePaymentSuccess');
        
        console.log('\n7. After payment:');
        simulateServerSideRendering();
        
        console.log('\n8. Starting new order...');
        await cartMachine.send('startNewOrder');
        
        console.log('\n9. New order state:');
        simulateServerSideRendering();
    };

    return runExample();
};

// Example of how to integrate with a real server endpoint
export const createServerSideRenderedViewMachine = (serverEndpoint: string) => {
    const cartMachine = createTastyFishBurgerCart({ cartId: '1' });
    
    // Simulate server polling
    const pollServer = async () => {
        try {
            // In a real implementation, this would fetch from the server
            const mockServerResponse = {
                viewModel: cartMachine.getViewModel(),
                timestamp: new Date().toISOString(),
                serverId: 'server-1'
            };
            
            console.log('Server polled:', mockServerResponse);
            return mockServerResponse;
        } catch (error) {
            console.error('Server polling failed:', error);
            return null;
        }
    };
    
    // Set up polling interval
    const startPolling = (intervalMs: number = 5000) => {
        const pollInterval = setInterval(pollServer, intervalMs);
        
        return () => {
            clearInterval(pollInterval);
        };
    };
    
    return {
        cartMachine,
        pollServer,
        startPolling,
        getViewModel: () => cartMachine.getViewModel()
    };
};

// Example usage
if (require.main === module) {
    runServerSideRenderedExample().catch(console.error);
} 