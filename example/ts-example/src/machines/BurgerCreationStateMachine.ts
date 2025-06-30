import { createStateMachine } from '../core/StateMachine';
import { BurgerAPI, Burger } from '../services/burger-api';

// Types
export interface BurgerCreationModel {
  burgers: Burger[];
  register: any;
  isHungry: boolean;
  selectedIngredients: string[];
  showAdmin: boolean;
  adminKey: string;
  loading: boolean;
  error: string | null;
  lastPayload: any;
}

export interface BurgerCreationConfig {
  machineId: string;
  adminKey?: string;
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

export const createBurgerCreation = (config: BurgerCreationConfig) => {
  return createStateMachine<BurgerCreationConfig, BurgerCreationModel>({
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
      lastPayload: null
    },
    states: stateDefinitions
  }).
  withMethod('loadData', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      transition('loading');

      // Load burgers and register in parallel
      const [burgerList, registerData] = await Promise.all([
        BurgerAPI.getBurgers(),
        fetch('http://localhost:3001/api/admin/register').then(res => res.json())
      ]);

      viewModel.burgers = burgerList;
      viewModel.register = registerData;
      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to load data';
      console.error('Error loading data:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
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
  }).
  withMethod('setHungry', (context) => {
    const { viewModel } = context;
    viewModel.isHungry = viewModel.lastPayload as boolean;
  }).
  withMethod('createBurger', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      transition('loading');

      const newBurger = await BurgerAPI.createBurger(
        viewModel.isHungry, 
        viewModel.selectedIngredients
      );
      
      viewModel.burgers = [...viewModel.burgers, newBurger];
      
      // Reset form
      viewModel.isHungry = false;
      viewModel.selectedIngredients = [];
      
      // Reload register to show updated sales
      const registerData = await fetch('http://localhost:3001/api/admin/register').then(res => res.json());
      viewModel.register = registerData;
      
      transition('ready');
      
      // Auto-refresh to see cooking progress
      setTimeout(() => {
        context.sendMessage('loadData');
      }, 1000);
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
        alert('Register cleared successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      alert('Failed to clear register');
      console.error('Error clearing register:', err);
    }
  }).
  withMethod('clearBurgers', async (context) => {
    const { viewModel } = context;
    try {
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
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      alert('Failed to clear burgers');
      console.error('Error clearing burgers:', err);
    }
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
  });
}; 