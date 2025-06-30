import { createStateMachine, StateMachine, StateMachineConfig, StateDefinition } from '../core/StateMachine';
import { createView, ViewMachine } from '../core/ViewMachine';
import React from 'react';

export interface AdminTabConfig {
    machineId: string;
    initialState?: string;
    adminKey?: string;
}

export interface AdminTabModel {
    currentTab: 'register' | 'receipts' | 'burgers' | 'cleanup';
    isAuthenticated: boolean;
    loading: boolean;
    message: string;
    register: any | null;
    burgers: any[];
    receipts: any[];
    adminKey: string;
    lastPayload: any; // Store the last payload for method access
}

const stateDefinitions: StateDefinition = {
    register: {
        receipts: {},
        burgers: {},
        cleanup: {}
    },
    receipts: {
        register: {},
        burgers: {},
        cleanup: {}
    },
    burgers: {
        register: {},
        receipts: {},
        cleanup: {}
    },
    cleanup: {
        register: {},
        receipts: {},
        burgers: {}
    }
};

export const createAdminTab = (config: AdminTabConfig) => {
    return createStateMachine<AdminTabConfig, AdminTabModel>({
        defaultConfig: config,
        defaultViewModel: {
            currentTab: (config.initialState as 'register' | 'receipts' | 'burgers' | 'cleanup') || 'register',
            isAuthenticated: false,
            loading: false,
            message: '',
            register: null,
            burgers: [],
            receipts: [],
            adminKey: config.adminKey || '',
            lastPayload: null
        },
        states: stateDefinitions
    }).
    withMethod('switchTab', (context) => {
        const { viewModel, transition } = context;
        const tab = viewModel.lastPayload as 'register' | 'receipts' | 'burgers' | 'cleanup';
        if (['register', 'receipts', 'burgers', 'cleanup'].includes(tab)) {
            viewModel.currentTab = tab;
            transition(tab);
        }
    }).
    withMethod('login', async (context) => {
        const { viewModel } = context;
        const adminKey = viewModel.lastPayload as string;
        
        viewModel.loading = true;
        viewModel.message = '';
        
        try {
            if (adminKey === 'fishburger-admin-2024') {
                viewModel.isAuthenticated = true;
                viewModel.adminKey = adminKey;
                viewModel.message = 'Admin access granted!';
                
                // Fetch initial data
                await context.sendMessage('fetchData');
            } else {
                viewModel.message = 'Invalid admin key';
            }
        } catch (error) {
            viewModel.message = 'Error during login';
        } finally {
            viewModel.loading = false;
        }
    }).
    withMethod('fetchData', async (context) => {
        const { viewModel } = context;
        
        if (!viewModel.isAuthenticated) return;
        
        viewModel.loading = true;
        viewModel.message = '';
        
        try {
            // Fetch register data
            const registerResponse = await fetch('http://localhost:3001/api/admin/register', {
                headers: { 'X-Admin-Key': viewModel.adminKey }
            });
            if (registerResponse.ok) {
                const registerData = await registerResponse.json();
                viewModel.register = registerData;
            }

            // Fetch burgers
            const burgersResponse = await fetch('http://localhost:3001/api/burgers');
            if (burgersResponse.ok) {
                const burgersData = await burgersResponse.json();
                viewModel.burgers = burgersData;
            }

            // Fetch receipts
            const receiptsResponse = await fetch('http://localhost:3001/api/admin/receipts', {
                headers: { 'X-Admin-Key': viewModel.adminKey }
            });
            if (receiptsResponse.ok) {
                const receiptsData = await receiptsResponse.json();
                viewModel.receipts = receiptsData;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            viewModel.message = 'Error loading data';
        } finally {
            viewModel.loading = false;
        }
    }).
    withMethod('clearRegister', async (context) => {
        const { viewModel } = context;
        
        if (!viewModel.isAuthenticated) return;
        
        viewModel.loading = true;
        viewModel.message = '';
        
        try {
            const response = await fetch('http://localhost:3001/api/admin/clear-register', {
                method: 'POST',
                headers: { 'X-Admin-Key': viewModel.adminKey }
            });
            if (response.ok) {
                viewModel.message = 'Register cleared successfully';
                await context.sendMessage('fetchData');
            } else {
                viewModel.message = 'Failed to clear register';
            }
        } catch (error) {
            viewModel.message = 'Error clearing register';
        } finally {
            viewModel.loading = false;
        }
    }).
    withMethod('clearBurgers', async (context) => {
        const { viewModel } = context;
        
        if (!viewModel.isAuthenticated) return;
        
        viewModel.loading = true;
        viewModel.message = '';
        
        try {
            const response = await fetch('http://localhost:3001/api/admin/clear-burgers', {
                method: 'POST',
                headers: { 'X-Admin-Key': viewModel.adminKey }
            });
            if (response.ok) {
                viewModel.message = 'All burgers cleared successfully';
                await context.sendMessage('fetchData');
            } else {
                viewModel.message = 'Failed to clear burgers';
            }
        } catch (error) {
            viewModel.message = 'Error clearing burgers';
        } finally {
            viewModel.loading = false;
        }
    }).
    withMethod('setMessage', (context) => {
        const { viewModel } = context;
        viewModel.message = viewModel.lastPayload as string || '';
    });
};

// Create the admin tab view using createView pattern
export const createAdminTabView = (props: any) => createView({
    machineId: 'admin-tab-view',
    states: ['register', 'receipts', 'burgers', 'cleanup'],
    render: (props) => {
        // This will be replaced by the actual AdminDashboard component
        return React.createElement('div', { className: 'admin-tab-view' }, 'Admin Tab View');
    },
    ...props
}); 