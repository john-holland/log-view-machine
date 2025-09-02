import { AppStructureConfig } from './StructuralSystem';

// Default application structure configuration
export const DefaultStructuralConfig: AppStructureConfig = {
  // Root application structure
  AppStructure: {
    id: 'log-view-machine-app',
    name: 'Log View Machine Application',
    type: 'application',
    routing: {
      path: '/'
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
    },
    // Add missing component mappings for the editor
    'app': {
      componentPath: 'src/App.tsx',
      tomePath: 'src/core/AppTome.tsx',
      templatePath: 'src/templates/app-component/'
    },
    'WaveTabs': {
      componentPath: 'src/components/WaveTabs.tsx',
      tomePath: 'src/component-middleware/wave-tabs/WaveTabsTomes.tsx',
      templatePath: 'src/component-middleware/wave-tabs/templates/wave-tabs-component/'
    },
    'SelectorInput': {
      componentPath: 'src/components/SelectorInput.tsx',
      tomePath: 'src/component-middleware/selector-input/SelectorInputTomes.tsx',
      templatePath: 'src/component-middleware/selector-input/templates/selector-input-component/'
    },
    'About': {
      componentPath: 'src/components/About.tsx',
      tomePath: 'src/component-middleware/about/AboutTomes.tsx',
      templatePath: 'src/component-middleware/about/templates/about-component/'
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
      },
      // Add routes for editor components
      {
        path: '/app',
        component: 'app'
      },
      {
        path: '/wave-tabs',
        component: 'WaveTabs'
      },
      {
        path: '/selector-input',
        component: 'SelectorInput'
      },
      {
        path: '/about',
        component: 'About'
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
        },
        {
          id: 'WaveTabs',
          label: 'Wave Tabs',
          path: '/wave-tabs',
          icon: '🌊'
        },
        {
          id: 'SelectorInput',
          label: 'Selector Input',
          path: '/selector-input',
          icon: '🎯'
        }
      ],
      secondary: [
        {
          id: 'settings',
          label: 'Settings',
          path: '/settings',
          icon: '⚙️'
        },
        {
          id: 'About',
          label: 'About',
          path: '/about',
          icon: 'ℹ️'
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
      },
      // Add missing tome configurations for the editor
      'app-tome': {
        machineId: 'app',
        description: 'Main application state management',
        states: ['idle', 'initializing', 'ready', 'navigating', 'error'],
        events: ['INITIALIZE', 'NAVIGATE', 'TAB_CHANGE', 'ERROR']
      },
      'WaveTabs-tome': {
        machineId: 'WaveTabs',
        description: 'Wave tabs navigation state management',
        states: ['idle', 'active', 'navigating', 'error'],
        events: ['TAB_SELECT', 'TAB_ADD', 'TAB_REMOVE', 'ERROR']
      },
      'SelectorInput-tome': {
        machineId: 'SelectorInput',
        description: 'Selector input state management',
        states: ['idle', 'inputting', 'validating', 'saving', 'error'],
        events: ['INPUT_CHANGE', 'VALIDATE', 'SAVE', 'CLEAR', 'ERROR']
      },
      'About-tome': {
        machineId: 'About',
        description: 'About component state management',
        states: ['idle', 'expanded', 'help', 'error'],
        events: ['EXPAND', 'SHOW_HELP', 'COLLAPSE', 'ERROR']
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
      },
      // Add missing machine states for the editor components
      'app': {
        idle: {
          description: 'Application is ready for initialization',
          actions: ['setup', 'prepare']
        },
        initializing: {
          description: 'Application is initializing',
          actions: ['loadConfig', 'setupMachines', 'prepareUI']
        },
        ready: {
          description: 'Application is ready for use',
          actions: ['enableNavigation', 'setupEventHandlers']
        },
        navigating: {
          description: 'Application is navigating between routes',
          actions: ['updateRoute', 'updateContext']
        },
        error: {
          description: 'Application encountered an error',
          actions: ['showError', 'provideRecovery']
        }
      },
      'wave-tabs': {
        idle: {
          description: 'Wave tabs are ready',
          actions: ['setup', 'prepare']
        },
        active: {
          description: 'Wave tabs are active and navigable',
          actions: ['enableNavigation', 'setupTabHandlers']
        },
        navigating: {
          description: 'Wave tabs are navigating between tabs',
          actions: ['updateActiveTab', 'updateHistory']
        },
        error: {
          description: 'Wave tabs encountered an error',
          actions: ['showError', 'provideRecovery']
        }
      },
      'selector-input': {
        idle: {
          description: 'Selector input is ready',
          actions: ['setup', 'prepare']
        },
        inputting: {
          description: 'User is entering input',
          actions: ['captureInput', 'validateFormat']
        },
        validating: {
          description: 'Input is being validated',
          actions: ['checkSyntax', 'verifyRules']
        },
        saving: {
          description: 'Input is being saved',
          actions: ['persistData', 'updateState']
        },
        error: {
          description: 'Selector input encountered an error',
          actions: ['showError', 'provideRecovery']
        }
      },
      'about': {
        idle: {
          description: 'About component is ready',
          actions: ['setup', 'prepare']
        },
        expanded: {
          description: 'About information is expanded',
          actions: ['showDetails', 'enableInteractions']
        },
        help: {
          description: 'Help information is displayed',
          actions: ['showHelp', 'enableNavigation']
        },
        error: {
          description: 'About component encountered an error',
          actions: ['showError', 'provideRecovery']
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
