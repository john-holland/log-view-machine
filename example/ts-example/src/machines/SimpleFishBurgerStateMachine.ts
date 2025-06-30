import { createStateMachine } from '../core/StateMachine';
import { BurgerAPI, Burger } from '../services/burger-api';

// Types
export interface SimpleFishBurgerModel {
  burgers: Burger[];
  loading: boolean;
  error: string | null;
  lastPayload: any;
}

export interface SimpleFishBurgerConfig {
  machineId: string;
}

// State definitions
const stateDefinitions = {
  initial: {
    loading: {},
    ready: {},
    error: {}
  },
  loading: {
    ready: {},
    error: {}
  },
  ready: {
    loading: {},
    error: {}
  },
  error: {
    loading: {},
    ready: {}
  }
};

export const createSimpleFishBurger = (config: SimpleFishBurgerConfig) => {
  return createStateMachine<SimpleFishBurgerConfig, SimpleFishBurgerModel>({
    defaultConfig: config,
    defaultViewModel: {
      burgers: [],
      loading: false,
      error: null,
      lastPayload: null
    },
    states: stateDefinitions
  }).
  withMethod('loadBurgers', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      transition('loading');

      const burgerList = await BurgerAPI.getBurgers();
      viewModel.burgers = burgerList;
      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to load burgers';
      console.error('Error loading burgers:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
    }
  }).
  withMethod('createBurger', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      transition('loading');

      const newBurger = await BurgerAPI.createBurger(false);
      viewModel.burgers = [...viewModel.burgers, newBurger];
      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to create burger';
      console.error('Error creating burger:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
    }
  }).
  withMethod('eatBurger', async (context) => {
    const { viewModel } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      const updatedBurger = await BurgerAPI.eatBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );
    } catch (err) {
      viewModel.error = 'Failed to eat burger';
      console.error('Error eating burger:', err);
    }
  }).
  withMethod('trashBurger', async (context) => {
    const { viewModel } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      const updatedBurger = await BurgerAPI.trashBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );
    } catch (err) {
      viewModel.error = 'Failed to trash burger';
      console.error('Error trashing burger:', err);
    }
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
  });
}; 