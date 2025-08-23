import { AppStructureConfig } from './StructuralSystem';

// Default application structure configuration
export const DefaultStructuralConfig: AppStructureConfig = {
  // Root application structure
  AppStructure: {
    id: 'log-view-machine-app',
    name: 'Log View Machine Application',
    type: 'application',
    routing: {
      base: '/',
      defaultRoute: '/dashboard'
    }
  },

  // Component to Tome mapping
  ComponentTomeMapping: {
    'dashboard': {
      componentPath: 'src/components/Dashboard.tsx',
      tomePath: 'src/component-middleware/dashboard/DashboardTomes.tsx',
      templatePath: 'src/component-middleware/dashboard/templates/dashboard-component/'
    },
    'log-viewer': {
      componentPath: 'src/components/LogViewer.tsx',
      tomePath: 'src/component-middleware/log-viewer/LogViewerTomes.tsx',
      templatePath: 'src/component-middleware/log-viewer/templates/log-viewer-component/'
    },
    'state-machine': {
      componentPath: 'src/components/StateMachine.tsx',
      tomePath: 'src/component-middleware/state-machine/StateMachineTomes.tsx',
      templatePath: 'src/component-middleware/state-machine/templates/state-machine-component/'
    },
    'tome-manager': {
      componentPath: 'src/components/TomeManager.tsx',
      tomePath: 'src/component-middleware/tome-manager/TomeManagerTomes.tsx',
      templatePath: 'src/component-middleware/tome-manager/templates/tome-manager-component/'
    },
    'settings': {
      componentPath: 'src/components/Settings.tsx',
      tomePath: 'src/component-middleware/settings/SettingsTomes.tsx',
      templatePath: 'src/component-middleware/settings/templates/settings-component/'
    }
  },

  // Routing configuration
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
        path: '/log-viewer',
        component: 'log-viewer'
      },
      {
        path: '/state-machine',
        component: 'state-machine'
      },
      {
        path: '/tome-manager',
        component: 'tome-manager'
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
          id: 'log-viewer',
          label: 'Log Viewer',
          path: '/log-viewer',
          icon: '📋'
        },
        {
          id: 'state-machine',
          label: 'State Machine',
          path: '/state-machine',
          icon: '⚙️'
        },
        {
          id: 'tome-manager',
          label: 'Tome Manager',
          path: '/tome-manager',
          icon: '📚'
        }
      ],
      secondary: [
        {
          id: 'settings',
          label: 'Settings',
          path: '/settings',
          icon: '⚙️'
        }
      ]
    }
  },

  // Tome configuration
  TomeConfig: {
    tomes: {
      'dashboard-tome': {
        machineId: 'dashboard',
        description: 'Main dashboard with overview and navigation',
        states: ['idle', 'loading', 'loaded', 'error'],
        events: ['LOAD', 'REFRESH', 'ERROR', 'CLEAR']
      },
      'log-viewer-tome': {
        machineId: 'log-viewer',
        description: 'Log viewing and analysis functionality',
        states: ['idle', 'loading', 'viewing', 'filtering', 'exporting', 'error'],
        events: ['LOAD_LOGS', 'FILTER', 'EXPORT', 'CLEAR', 'ERROR']
      },
      'state-machine-tome': {
        machineId: 'state-machine',
        description: 'State machine visualization and management',
        states: ['idle', 'loading', 'visualizing', 'editing', 'saving', 'error'],
        events: ['LOAD_MACHINE', 'VISUALIZE', 'EDIT', 'SAVE', 'ERROR']
      },
      'tome-manager-tome': {
        machineId: 'tome-manager',
        description: 'Tome lifecycle and configuration management',
        states: ['idle', 'loading', 'managing', 'creating', 'editing', 'deleting', 'error'],
        events: ['LOAD_TOMES', 'CREATE', 'EDIT', 'DELETE', 'SAVE', 'ERROR']
      },
      'settings-tome': {
        machineId: 'settings',
        description: 'Application settings and configuration',
        states: ['idle', 'loading', 'editing', 'saving', 'resetting', 'error'],
        events: ['LOAD_SETTINGS', 'EDIT', 'SAVE', 'RESET', 'ERROR']
      }
    },
    machineStates: {
      'dashboard': {
        idle: {
          description: 'Dashboard is ready for interaction',
          actions: ['initialize', 'setupEventListeners']
        },
        loading: {
          description: 'Loading dashboard data',
          actions: ['fetchData', 'showLoadingState']
        },
        loaded: {
          description: 'Dashboard data is loaded and ready',
          actions: ['renderDashboard', 'setupInteractions']
        },
        error: {
          description: 'Error occurred while loading dashboard',
          actions: ['showError', 'provideRetryOption']
        }
      },
      'log-viewer': {
        idle: {
          description: 'Log viewer is ready',
          actions: ['initialize', 'setupLogSources']
        },
        loading: {
          description: 'Loading log data',
          actions: ['fetchLogs', 'parseLogs', 'showProgress']
        },
        viewing: {
          description: 'Displaying logs for viewing',
          actions: ['renderLogs', 'setupFilters', 'enableSearch']
        },
        filtering: {
          description: 'Applying filters to logs',
          actions: ['applyFilters', 'updateView', 'showFilterCount']
        }
      }
    }
  }
};

// Utility function to create a custom structural config
export function createStructuralConfig(
  overrides: Partial<AppStructureConfig> = {}
): AppStructureConfig {
  return {
    ...DefaultStructuralConfig,
    ...overrides,
    ComponentTomeMapping: {
      ...DefaultStructuralConfig.ComponentTomeMapping,
      ...overrides.ComponentTomeMapping
    },
    RoutingConfig: {
      ...DefaultStructuralConfig.RoutingConfig,
      ...overrides.RoutingConfig,
      routes: [
        ...(overrides.RoutingConfig?.routes || DefaultStructuralConfig.RoutingConfig.routes)
      ],
      navigation: {
        ...DefaultStructuralConfig.RoutingConfig.navigation,
        ...overrides.RoutingConfig?.navigation,
        primary: [
          ...(overrides.RoutingConfig?.navigation?.primary || DefaultStructuralConfig.RoutingConfig.navigation.primary)
        ],
        secondary: [
          ...(overrides.RoutingConfig?.navigation?.secondary || DefaultStructuralConfig.RoutingConfig.navigation.secondary || [])
        ]
      }
    },
    TomeConfig: {
      ...DefaultStructuralConfig.TomeConfig,
      ...overrides.TomeConfig,
      tomes: {
        ...DefaultStructuralConfig.TomeConfig.tomes,
        ...overrides.TomeConfig?.tomes
      },
      machineStates: {
        ...DefaultStructuralConfig.TomeConfig.machineStates,
        ...overrides.TomeConfig?.machineStates
      }
    }
  };
}

// Export the default config
export default DefaultStructuralConfig;
