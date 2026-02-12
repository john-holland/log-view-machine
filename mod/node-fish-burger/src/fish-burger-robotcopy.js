/**
 * Fish-burger-specific RobotCopy abstraction.
 * Creates a RobotCopy with fish-burger config and adds domain methods
 * and integrateWithViewStateMachine so library components work without
 * the core library depending on fish-burger.
 */
import { createRobotCopy } from 'log-view-machine';

/**
 * @returns {import('log-view-machine').RobotCopy & {
 *   startCooking(orderId: string, ingredients: string[]): Promise<any>;
 *   updateProgress(orderId: string, cookingTime: number, temperature: number): Promise<any>;
 *   completeCooking(orderId: string): Promise<any>;
 *   integrateWithViewStateMachine(viewStateMachine: any): any;
 * }}
 */
export function createFishBurgerRobotCopy() {
  const robotCopy = createRobotCopy({
    unleashAppName: 'fish-burger-frontend',
    backendSelectorToggle: 'fish-burger-kotlin-backend',
    apiBasePath: '/api/fish-burger',
    initialToggles: {
      'fish-burger-kotlin-backend': false,
      'fish-burger-node-backend': true,
      'enable-tracing': true,
      'enable-datadog': true,
    },
  });

  const startCooking = (orderId, ingredients) =>
    robotCopy.sendMessage('start', { orderId, ingredients });

  const updateProgress = (orderId, cookingTime, temperature) =>
    robotCopy.sendMessage('progress', { orderId, cookingTime, temperature });

  const completeCooking = (orderId) =>
    robotCopy.sendMessage('complete', { orderId });

  const integrateWithViewStateMachine = (viewStateMachine) => {
    viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
      return startCooking(message.orderId, message.ingredients);
    });
    viewStateMachine.registerRobotCopyHandler('UPDATE_PROGRESS', async (message) => {
      return updateProgress(message.orderId, message.cookingTime, message.temperature);
    });
    viewStateMachine.registerRobotCopyHandler('COMPLETE_COOKING', async (message) => {
      return completeCooking(message.orderId);
    });
    return wrapper;
  };

  const wrapper = Object.assign(robotCopy, {
    startCooking,
    updateProgress,
    completeCooking,
    integrateWithViewStateMachine,
  });

  return wrapper;
}
