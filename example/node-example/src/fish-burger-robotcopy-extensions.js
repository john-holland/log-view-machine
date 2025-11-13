/**
 * Fish Burger RobotCopy Extensions
 * 
 * Example helper functions for RobotCopy specific to the Fish Burger application
 * These were previously in the core RobotCopy class but are app-specific
 * 
 * Usage:
 *   import { FishBurgerRobotCopyExtensions } from './fish-burger-robotcopy-extensions.js';
 *   const extensions = new FishBurgerRobotCopyExtensions(robotCopy);
 *   await extensions.startCooking(orderId, ingredients);
 */

export class FishBurgerRobotCopyExtensions {
  constructor(robotCopy) {
    this.robotCopy = robotCopy;
  }

  /**
   * Start cooking a fish burger order
   * @param {string} orderId - The order ID
   * @param {string[]} ingredients - List of ingredients
   * @returns {Promise<any>} Response from backend
   */
  async startCooking(orderId, ingredients) {
    return this.robotCopy.sendMessage('start', { orderId, ingredients });
  }

  /**
   * Update cooking progress
   * @param {string} orderId - The order ID
   * @param {number} cookingTime - Current cooking time in seconds
   * @param {number} temperature - Current temperature
   * @returns {Promise<any>} Response from backend
   */
  async updateProgress(orderId, cookingTime, temperature) {
    return this.robotCopy.sendMessage('progress', { orderId, cookingTime, temperature });
  }

  /**
   * Mark cooking as complete
   * @param {string} orderId - The order ID
   * @returns {Promise<any>} Response from backend
   */
  async completeCooking(orderId) {
    return this.robotCopy.sendMessage('complete', { orderId });
  }

  /**
   * Integration with ViewStateMachine
   * Registers message handlers for ViewStateMachine events
   * 
   * @param {any} viewStateMachine - The ViewStateMachine instance
   * @returns {FishBurgerRobotCopyExtensions} This instance for chaining
   * 
   * @example
   * const extensions = new FishBurgerRobotCopyExtensions(robotCopy);
   * extensions.integrateWithViewStateMachine(myViewStateMachine);
   * 
   * // Now the machine can handle these events:
   * machine.send('START_COOKING', { orderId: '123', ingredients: ['fish', 'bun'] });
   */
  integrateWithViewStateMachine(viewStateMachine) {
    // Register message handlers for ViewStateMachine
    if (typeof viewStateMachine.registerRobotCopyHandler === 'function') {
      viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
        return this.startCooking(message.orderId, message.ingredients);
      });

      viewStateMachine.registerRobotCopyHandler('UPDATE_PROGRESS', async (message) => {
        return this.updateProgress(message.orderId, message.cookingTime, message.temperature);
      });

      viewStateMachine.registerRobotCopyHandler('COMPLETE_COOKING', async (message) => {
        return this.completeCooking(message.orderId);
      });
    } else {
      console.warn('ViewStateMachine does not support registerRobotCopyHandler');
    }

    return this;
  }

  /**
   * Example: Create a complete fish burger workflow
   * @param {string} orderId - The order ID
   * @param {string[]} ingredients - Ingredients list
   * @returns {Promise<any>} Final result
   */
  async cookFishBurger(orderId, ingredients) {
    console.log(`🍔 Starting fish burger workflow for order ${orderId}`);
    
    try {
      // Start cooking
      const startResult = await this.startCooking(orderId, ingredients);
      console.log('🍔 Cooking started:', startResult);
      
      // Simulate progress updates
      for (let time = 0; time <= 120; time += 30) {
        const temp = 180 + (time / 2); // Gradually increase temp
        await this.updateProgress(orderId, time, temp);
        console.log(`🍔 Progress: ${time}s at ${temp}°F`);
        
        // Wait a bit between updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Complete cooking
      const completeResult = await this.completeCooking(orderId);
      console.log('🍔 Cooking complete:', completeResult);
      
      return completeResult;
    } catch (error) {
      console.error('🍔 Cooking workflow failed:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create extensions with developer mode check
 * @param {any} robotCopy - RobotCopy instance
 * @param {boolean} developerMode - Enable developer/example features
 * @returns {FishBurgerRobotCopyExtensions|null}
 */
export function createFishBurgerExtensions(robotCopy, developerMode = false) {
  if (!developerMode) {
    console.log('🍔 Fish Burger extensions disabled (developer mode off)');
    return null;
  }
  
  console.log('🍔 Fish Burger extensions enabled (developer mode on)');
  return new FishBurgerRobotCopyExtensions(robotCopy);
}

// Example usage wrapped in IIFE with developer check
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (function() {
    console.log('🍔 Fish Burger example extensions loaded in development mode');
    
    // Example: How to use the extensions
    // const robotCopy = createRobotCopy({...});
    // const extensions = new FishBurgerRobotCopyExtensions(robotCopy);
    // await extensions.cookFishBurger('order-123', ['fish', 'bun', 'lettuce', 'sauce']);
  })();
}

