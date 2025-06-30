import { createStateMachine } from '../core/StateMachine';
import { BurgerAPI, Burger } from '../services/burger-api';

// Types
export interface BurgerCreationViewModel {
  burgers: Burger[];
  register: any;
  isHungry: boolean;
  selectedIngredients: string[];
  showAdmin: boolean;
  adminKey: string;
  loading: boolean;
  error: string | null;
  lastPayload: any;
  currentState: string;
  canCreateBurger: boolean;
  canEatBurger: boolean;
  canTrashBurger: boolean;
  showLoadingSpinner: boolean;
  showErrorBanner: boolean;
  showSuccessMessage: boolean;
  successMessage: string;
}

export interface BurgerCreationConfig {
  machineId: string;
  adminKey?: string;
}

// Enhanced state definitions with UI-specific states
const stateDefinitions = {
  initial: {
    loading: {},
    ready: {},
    error: {},
    creating: {},
    success: {}
  },
  loading: {
    ready: {},
    error: {},
    creating: {}
  },
  ready: {
    loading: {},
    error: {},
    creating: {},
    success: {}
  },
  error: {
    loading: {},
    ready: {},
    creating: {}
  },
  creating: {
    ready: {},
    error: {},
    success: {}
  },
  success: {
    ready: {},
    loading: {},
    creating: {}
  }
};

export const createBurgerCreationView = (config: BurgerCreationConfig) => {
  return createStateMachine<BurgerCreationConfig, BurgerCreationViewModel>({
    defaultConfig: config,
    defaultViewModel: {
      burgers: [],
      register: null,
      isHungry: false,
      selectedIngredients: [],
      showAdmin: false,
      adminKey: config.adminKey || '',
      loading: false,
      error: null,
      lastPayload: null,
      currentState: 'initial',
      canCreateBurger: false,
      canEatBurger: false,
      canTrashBurger: false,
      showLoadingSpinner: false,
      showErrorBanner: false,
      showSuccessMessage: false,
      successMessage: ''
    },
    states: stateDefinitions
  }).
  withMethod('loadData', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorBanner = false;
      transition('loading');

      // Load burgers and register in parallel
      const [burgerList, registerData] = await Promise.all([
        BurgerAPI.getBurgers(),
        fetch('http://localhost:3001/api/admin/register').then(res => res.json())
      ]);

      viewModel.burgers = burgerList;
      viewModel.register = registerData;
      viewModel.canCreateBurger = viewModel.selectedIngredients.length > 0;
      viewModel.canEatBurger = viewModel.burgers.some(b => b.state === 'READY');
      viewModel.canTrashBurger = viewModel.burgers.length > 0;
      
      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to load data';
      viewModel.showErrorBanner = true;
      console.error('Error loading data:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('toggleIngredient', (context) => {
    const { viewModel } = context;
    const ingredient = viewModel.lastPayload as string;
    
    if (viewModel.selectedIngredients.includes(ingredient)) {
      viewModel.selectedIngredients = viewModel.selectedIngredients.filter(i => i !== ingredient);
    } else {
      viewModel.selectedIngredients = [...viewModel.selectedIngredients, ingredient];
    }
    
    // Update UI state based on ingredients
    viewModel.canCreateBurger = viewModel.selectedIngredients.length > 0;
  }).
  withMethod('setHungry', (context) => {
    const { viewModel } = context;
    viewModel.isHungry = viewModel.lastPayload as boolean;
  }).
  withMethod('createBurger', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.showLoadingSpinner = true;
      viewModel.error = null;
      viewModel.showErrorBanner = false;
      viewModel.showSuccessMessage = false;
      transition('creating');

      const newBurger = await BurgerAPI.createBurger(
        viewModel.isHungry, 
        viewModel.selectedIngredients
      );
      
      viewModel.burgers = [...viewModel.burgers, newBurger];
      
      // Reset form
      viewModel.isHungry = false;
      viewModel.selectedIngredients = [];
      viewModel.canCreateBurger = false;
      
      // Reload register to show updated sales
      const registerData = await fetch('http://localhost:3001/api/admin/register').then(res => res.json());
      viewModel.register = registerData;
      
      viewModel.successMessage = 'Burger created successfully!';
      viewModel.showSuccessMessage = true;
      transition('success');
      
      // Auto-refresh to see cooking progress
      setTimeout(() => {
        context.sendMessage('loadData');
      }, 1000);
    } catch (err) {
      viewModel.error = 'Failed to create burger';
      viewModel.showErrorBanner = true;
      console.error('Error creating burger:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('eatBurger', async (context) => {
    const { viewModel } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      viewModel.showLoadingSpinner = true;
      const updatedBurger = await BurgerAPI.eatBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );
      
      viewModel.canEatBurger = viewModel.burgers.some(b => b.state === 'READY');
      viewModel.successMessage = 'Burger eaten!';
      viewModel.showSuccessMessage = true;
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        viewModel.showSuccessMessage = false;
      }, 3000);
    } catch (err) {
      viewModel.error = 'Failed to eat burger';
      viewModel.showErrorBanner = true;
      console.error('Error eating burger:', err);
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('trashBurger', async (context) => {
    const { viewModel } = context;
    const burgerId = viewModel.lastPayload as number;
    
    try {
      viewModel.showLoadingSpinner = true;
      const updatedBurger = await BurgerAPI.trashBurger(burgerId);
      viewModel.burgers = viewModel.burgers.map(burger => 
        burger.id === burgerId ? updatedBurger : burger
      );
      
      viewModel.canTrashBurger = viewModel.burgers.length > 0;
      viewModel.successMessage = 'Burger trashed!';
      viewModel.showSuccessMessage = true;
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        viewModel.showSuccessMessage = false;
      }, 3000);
    } catch (err) {
      viewModel.error = 'Failed to trash burger';
      viewModel.showErrorBanner = true;
      console.error('Error trashing burger:', err);
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('toggleAdmin', (context) => {
    const { viewModel } = context;
    viewModel.showAdmin = !viewModel.showAdmin;
  }).
  withMethod('setAdminKey', (context) => {
    const { viewModel } = context;
    viewModel.adminKey = viewModel.lastPayload as string;
  }).
  withMethod('clearRegister', async (context) => {
    const { viewModel } = context;
    try {
      viewModel.showLoadingSpinner = true;
      const response = await fetch('http://localhost:3001/api/admin/register/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: viewModel.adminKey })
      });
      
      if (response.ok) {
        const result = await response.json();
        viewModel.register = result.newRegister;
        viewModel.adminKey = '';
        viewModel.showAdmin = false;
        viewModel.successMessage = 'Register cleared successfully!';
        viewModel.showSuccessMessage = true;
      } else {
        const error = await response.json();
        viewModel.error = `Error: ${error.error}`;
        viewModel.showErrorBanner = true;
      }
    } catch (err) {
      viewModel.error = 'Failed to clear register';
      viewModel.showErrorBanner = true;
      console.error('Error clearing register:', err);
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('clearBurgers', async (context) => {
    const { viewModel } = context;
    try {
      viewModel.showLoadingSpinner = true;
      const response = await fetch('http://localhost:3001/api/admin/burgers/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: viewModel.adminKey })
      });
      
      if (response.ok) {
        const result = await response.json();
        viewModel.burgers = [];
        viewModel.adminKey = '';
        viewModel.showAdmin = false;
        viewModel.canEatBurger = false;
        viewModel.canTrashBurger = false;
        viewModel.successMessage = result.message;
        viewModel.showSuccessMessage = true;
      } else {
        const error = await response.json();
        viewModel.error = `Error: ${error.error}`;
        viewModel.showErrorBanner = true;
      }
    } catch (err) {
      viewModel.error = 'Failed to clear burgers';
      viewModel.showErrorBanner = true;
      console.error('Error clearing burgers:', err);
    } finally {
      viewModel.showLoadingSpinner = false;
    }
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
    viewModel.showErrorBanner = false;
  }).
  withMethod('clearSuccess', (context) => {
    const { viewModel } = context;
    viewModel.showSuccessMessage = false;
    viewModel.successMessage = '';
  });
}; 