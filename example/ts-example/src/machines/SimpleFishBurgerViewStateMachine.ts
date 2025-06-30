import { createStateMachine } from '../core/StateMachine';
import { BurgerAPI, Burger } from '../services/burger-api';

// Types
export interface SimpleFishBurgerViewModel {
  burgers: Burger[];
  loading: boolean;
  error: string | null;
  lastPayload: any;
  currentState: string;
  showBurgerList: boolean;
  showCreateForm: boolean;
  showEmptyState: boolean;
  showErrorState: boolean;
  showLoadingSpinner: boolean;
  showSuccessMessage: boolean;
  successMessage: string;
  canCreateBurger: boolean;
  canEatBurger: boolean;
  canTrashBurger: boolean;
  readyBurgers: Burger[];
  cookingBurgers: Burger[];
  eatenBurgers: Burger[];
  trashedBurgers: Burger[];
  totalBurgers: number;
  lastActionTime: string;
}

export interface SimpleFishBurgerConfig {
  machineId: string;
}

// Enhanced state definitions with UI-specific states
const stateDefinitions = {
  initial: {
    loading: {},
    ready: {},
    error: {},
    creating: {},
    eating: {},
    trashing: {},
    empty: {}
  },
  loading: {
    ready: {},
    error: {},
    empty: {},
    creating: {}
  },
  ready: {
    loading: {},
    error: {},
    creating: {},
    eating: {},
    trashing: {},
    empty: {}
  },
  error: {
    loading: {},
    ready: {},
    creating: {}
  },
  creating: {
    ready: {},
    error: {},
    loading: {}
  },
  eating: {
    ready: {},
    error: {},
    loading: {}
  },
  trashing: {
    ready: {},
    error: {},
    loading: {}
  },
  empty: {
    loading: {},
    ready: {},
    creating: {}
  }
};

export const createSimpleFishBurgerView = (config: SimpleFishBurgerConfig) => {
  return createStateMachine<SimpleFishBurgerConfig, SimpleFishBurgerViewModel>({
    defaultConfig: config,
    defaultViewModel: {
      burgers: [],
      loading: false,
      error: null,
      lastPayload: null,
      currentState: 'initial',
      showBurgerList: false,
      showCreateForm: true,
      showEmptyState: false,
      showErrorState: false,
      showLoadingSpinner: false,
      showSuccessMessage: false,
      successMessage: '',
      canCreateBurger: true,
      canEatBurger: false,
      canTrashBurger: false,
      readyBurgers: [],
      cookingBurgers: [],
      eatenBurgers: [],
      trashedBurgers: [],
      totalBurgers: 0,
      lastActionTime: ''
    },
    states: stateDefinitions
  }).
  withMethod('loadBurgers', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorState = false;
      transition('loading');

      const burgers = await BurgerAPI.getBurgers();
      viewModel.burgers = burgers;
      viewModel.totalBurgers = burgers.length;

      // Categorize burgers by state
      viewModel.readyBurgers = burgers.filter(b => b.state === 'READY');
      viewModel.cookingBurgers = burgers.filter(b => b.state === 'COOKING');
      viewModel.eatenBurgers = burgers.filter(b => b.state === 'EAT');
      viewModel.trashedBurgers = burgers.filter(b => b.state === 'TRASH');

      // Update UI state
      viewModel.canEatBurger = viewModel.readyBurgers.length > 0;
      viewModel.canTrashBurger = burgers.length > 0;
      viewModel.showBurgerList = burgers.length > 0;
      viewModel.showEmptyState = burgers.length === 0;
      viewModel.showCreateForm = true;

      if (burgers.length === 0) {
        transition('empty');
      } else {
        transition('ready');
      }
    } catch (err) {
      viewModel.error = 'Failed to load burgers';
      viewModel.showErrorState = true;
      console.error('Error loading burgers:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('createBurger', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorState = false;
      viewModel.showSuccessMessage = false;
      transition('creating');

      const newBurger = await BurgerAPI.createBurger(false, []);
      viewModel.burgers = [...viewModel.burgers, newBurger];
      viewModel.totalBurgers = viewModel.burgers.length;

      // Update burger categories
      viewModel.cookingBurgers = viewModel.burgers.filter(b => b.state === 'COOKING');
      viewModel.canTrashBurger = viewModel.burgers.length > 0;
      viewModel.showBurgerList = true;
      viewModel.showEmptyState = false;

      viewModel.successMessage = 'Burger created successfully!';
      viewModel.showSuccessMessage = true;
      viewModel.lastActionTime = new Date().toISOString();

      // Hide success message after 3 seconds
      setTimeout(() => {
        viewModel.showSuccessMessage = false;
      }, 3000);

      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to create burger';
      viewModel.showErrorState = true;
      console.error('Error creating burger:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('eatBurger', async (context) => {
    const { viewModel, transition } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorState = false;
      transition('eating');

      const updatedBurger = await BurgerAPI.eatBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );

      // Update burger categories
      viewModel.readyBurgers = viewModel.burgers.filter(b => b.state === 'READY');
      viewModel.eatenBurgers = viewModel.burgers.filter(b => b.state === 'EAT');
      viewModel.canEatBurger = viewModel.readyBurgers.length > 0;

      viewModel.successMessage = 'Burger eaten!';
      viewModel.showSuccessMessage = true;
      viewModel.lastActionTime = new Date().toISOString();

      // Hide success message after 3 seconds
      setTimeout(() => {
        viewModel.showSuccessMessage = false;
      }, 3000);

      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to eat burger';
      viewModel.showErrorState = true;
      console.error('Error eating burger:', err);
      transition('error');
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('trashBurger', async (context) => {
    const { viewModel, transition } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorState = false;
      transition('trashing');

      const updatedBurger = await BurgerAPI.trashBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );

      // Update burger categories
      viewModel.readyBurgers = viewModel.burgers.filter(b => b.state === 'READY');
      viewModel.cookingBurgers = viewModel.burgers.filter(b => b.state === 'COOKING');
      viewModel.trashedBurgers = viewModel.burgers.filter(b => b.state === 'TRASH');
      viewModel.canEatBurger = viewModel.readyBurgers.length > 0;
      viewModel.canTrashBurger = viewModel.burgers.length > 0;

      viewModel.successMessage = 'Burger trashed!';
      viewModel.showSuccessMessage = true;
      viewModel.lastActionTime = new Date().toISOString();

      // Hide success message after 3 seconds
      setTimeout(() => {
        viewModel.showSuccessMessage = false;
      }, 3000);

      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to trash burger';
      viewModel.showErrorState = true;
      console.error('Error trashing burger:', err);
      transition('error');
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
    viewModel.showErrorState = false;
  }).
  withMethod('clearSuccess', (context) => {
    const { viewModel } = context;
    viewModel.showSuccessMessage = false;
    viewModel.successMessage = '';
  }).
  withMethod('toggleCreateForm', (context) => {
    const { viewModel } = context;
    viewModel.showCreateForm = !viewModel.showCreateForm;
  }).
  withMethod('toggleBurgerList', (context) => {
    const { viewModel } = context;
    viewModel.showBurgerList = !viewModel.showBurgerList;
  }).
  withMethod('refreshBurgers', async (context) => {
    // This is the same as loadBurgers but without changing the current state
    const { viewModel } = context;
    try {
      viewModel.showLoadingSpinner = true;
      const burgers = await BurgerAPI.getBurgers();
      viewModel.burgers = burgers;
      viewModel.totalBurgers = burgers.length;

      // Categorize burgers by state
      viewModel.readyBurgers = burgers.filter(b => b.state === 'READY');
      viewModel.cookingBurgers = burgers.filter(b => b.state === 'COOKING');
      viewModel.eatenBurgers = burgers.filter(b => b.state === 'EAT');
      viewModel.trashedBurgers = burgers.filter(b => b.state === 'TRASH');

      // Update UI state
      viewModel.canEatBurger = viewModel.readyBurgers.length > 0;
      viewModel.canTrashBurger = burgers.length > 0;
      viewModel.showBurgerList = burgers.length > 0;
      viewModel.showEmptyState = burgers.length === 0;
    } catch (err) {
      viewModel.error = 'Failed to refresh burgers';
      console.error('Error refreshing burgers:', err);
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  });
}; 