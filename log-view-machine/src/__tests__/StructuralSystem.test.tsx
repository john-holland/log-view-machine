import { StructuralSystem, createStructuralSystem, AppStructureConfig } from '../core/structural/StructuralSystem';

// Mock configuration for testing
const mockConfig: AppStructureConfig = {
  AppStructure: {
    id: 'test-app',
    name: 'Test Application',
    type: 'application',
    routing: {
      base: '/',
      defaultRoute: '/dashboard'
    }
  },
  ComponentTomeMapping: {
    'dashboard': {
      componentPath: 'src/components/Dashboard.tsx',
      tomePath: 'src/component-middleware/dashboard/DashboardTomes.tsx',
      templatePath: 'src/component-middleware/dashboard/templates/'
    },
    'settings': {
      componentPath: 'src/components/Settings.tsx',
      tomePath: 'src/component-middleware/settings/SettingsTomes.tsx',
      templatePath: 'src/component-middleware/settings/templates/'
    }
  },
  RoutingConfig: {
    routes: [
      {
        path: '/',
        redirect: '/dashboard'
      },
      {
        path: '/dashboard',
        component: 'dashboard'
      },
      {
        path: '/settings',
        component: 'settings'
      }
    ],
    navigation: {
      primary: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/dashboard',
          icon: '📊'
        },
        {
          id: 'settings',
          label: 'Settings',
          path: '/settings',
          icon: '⚙️'
        }
      ]
    }
  },
  TomeConfig: {
    tomes: {
      'dashboard-tome': {
        machineId: 'dashboard',
        description: 'Dashboard component',
        states: ['idle', 'loading', 'loaded'],
        events: ['LOAD', 'REFRESH']
      },
      'settings-tome': {
        machineId: 'settings',
        description: 'Settings component',
        states: ['idle', 'editing', 'saving'],
        events: ['EDIT', 'SAVE']
      }
    }
  }
};

describe('StructuralSystem', () => {
  let system: StructuralSystem;

  beforeEach(() => {
    system = new StructuralSystem(mockConfig);
  });

  describe('constructor and basic functionality', () => {
    it('should create a structural system with the provided config', () => {
      expect(system).toBeInstanceOf(StructuralSystem);
      expect(system.getAppStructure()).toEqual(mockConfig.AppStructure);
      expect(system.getComponentTomeMapping()).toEqual(mockConfig.ComponentTomeMapping);
      expect(system.getRoutingConfig()).toEqual(mockConfig.RoutingConfig);
      expect(system.getTomeConfig()).toEqual(mockConfig.TomeConfig);
    });

    it('should create a structural system using the factory function', () => {
      const factorySystem = createStructuralSystem(mockConfig);
      expect(factorySystem).toBeInstanceOf(StructuralSystem);
      expect(factorySystem.getAppStructure()).toEqual(mockConfig.AppStructure);
    });
  });

  describe('machine management', () => {
    it('should create a machine for a valid component', () => {
      const machine = system.createMachine('dashboard', { title: 'Test' });
      expect(machine).toBeDefined();
      expect(machine).toBeInstanceOf(require('../core/ViewStateMachine').ViewStateMachine);
    });

    it('should return null for invalid component', () => {
      const machine = system.createMachine('invalid-component');
      expect(machine).toBeNull();
    });

    it('should retrieve existing machines', () => {
      system.createMachine('dashboard');
      const machine = system.getMachine('dashboard');
      expect(machine).toBeDefined();
    });

    it('should return undefined for non-existent machines', () => {
      const machine = system.getMachine('non-existent');
      expect(machine).toBeUndefined();
    });

    it('should track all created machines', () => {
      system.createMachine('dashboard');
      system.createMachine('settings');
      const machines = system.getAllMachines();
      expect(machines.size).toBe(2);
      expect(machines.has('dashboard')).toBe(true);
      expect(machines.has('settings')).toBe(true);
    });
  });

  describe('routing functionality', () => {
    it('should find routes by path', () => {
      const route = system.findRoute('/dashboard');
      expect(route).toBeDefined();
      expect(route?.component).toBe('dashboard');
    });

    it('should return null for non-existent routes', () => {
      const route = system.findRoute('/non-existent');
      expect(route).toBeNull();
    });

    it('should find navigation items by path', () => {
      const navItem = system.findNavigationItem('/dashboard');
      expect(navItem).toBeDefined();
      expect(navItem?.label).toBe('Dashboard');
    });

    it('should return null for non-existent navigation items', () => {
      const navItem = system.findNavigationItem('/non-existent');
      expect(navItem).toBeNull();
    });

    it('should generate breadcrumbs for a path', () => {
      const breadcrumbs = system.getBreadcrumbs('/dashboard');
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].path).toBe('/dashboard');
    });

    it('should return empty breadcrumbs for root path', () => {
      const breadcrumbs = system.getBreadcrumbs('/');
      expect(breadcrumbs).toHaveLength(0);
    });
  });

  describe('configuration validation', () => {
    it('should validate a correct configuration', () => {
      const validation = system.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing tome configurations', () => {
      const invalidConfig = {
        ...mockConfig,
        ComponentTomeMapping: {
          ...mockConfig.ComponentTomeMapping,
          'new-component': {
            componentPath: 'src/components/NewComponent.tsx',
            tomePath: 'src/component-middleware/new-component/NewComponentTomes.tsx',
            templatePath: 'src/component-middleware/new-component/templates/'
          }
        }
      };
      const invalidSystem = new StructuralSystem(invalidConfig);
      const validation = invalidSystem.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Component new-component has no corresponding tome configuration');
    });

    it('should detect invalid route references', () => {
      const invalidConfig = {
        ...mockConfig,
        RoutingConfig: {
          ...mockConfig.RoutingConfig,
          routes: [
            ...mockConfig.RoutingConfig.routes,
            {
              path: '/invalid',
              component: 'non-existent-component'
            }
          ]
        }
      };
      const invalidSystem = new StructuralSystem(invalidConfig);
      const validation = invalidSystem.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Route /invalid references unknown component: non-existent-component');
    });
  });
});
