/**
 * Fish-burger-specific RobotCopy abstraction.
 * Creates a RobotCopy with fish-burger config and adds domain methods
 * and integrateWithViewStateMachine so library components work without
 * the core library depending on fish-burger.
 */
import { createRobotCopy, RobotCopy } from 'log-view-machine';

export interface FishBurgerRobotCopy extends RobotCopy {
  startCooking(orderId: string, ingredients: string[]): Promise<any>;
  updateProgress(orderId: string, cookingTime: number, temperature: number): Promise<any>;
  completeCooking(orderId: string): Promise<any>;
  integrateWithViewStateMachine(viewStateMachine: any): FishBurgerRobotCopy;
}

export function createFishBurgerRobotCopy(): FishBurgerRobotCopy {
  const robotCopy = createRobotCopy({
    unleashAppName: 'fish-burger-frontend',
    backendSelectorToggle: 'fish-burger-kotlin-backend',
    apiBasePath: '/api/fish-burger',
    nodeBackendUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    initialToggles: {
      'fish-burger-kotlin-backend': false,
      'fish-burger-node-backend': true,
      'enable-tracing': true,
      'enable-datadog': true,
    },
  });

  const startCooking = (orderId: string, ingredients: string[]) =>
    robotCopy.sendMessage('start', { orderId, ingredients });

  const updateProgress = (orderId: string, cookingTime: number, temperature: number) =>
    robotCopy.sendMessage('progress', { orderId, cookingTime, temperature });

  const completeCooking = (orderId: string) =>
    robotCopy.sendMessage('complete', { orderId });

  const integrateWithViewStateMachine = (viewStateMachine: any): FishBurgerRobotCopy => {
    viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message: any) => {
      return startCooking(message.orderId, message.ingredients);
    });
    viewStateMachine.registerRobotCopyHandler('UPDATE_PROGRESS', async (message: any) => {
      return updateProgress(message.orderId, message.cookingTime, message.temperature);
    });
    viewStateMachine.registerRobotCopyHandler('COMPLETE_COOKING', async (message: any) => {
      return completeCooking(message.orderId);
    });
    return wrapper;
  };

  const wrapper = Object.assign(robotCopy, {
    startCooking,
    updateProgress,
    completeCooking,
    integrateWithViewStateMachine,
  }) as FishBurgerRobotCopy;

  return wrapper;
}
