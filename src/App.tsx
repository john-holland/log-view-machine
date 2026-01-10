import React, { ErrorInfo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { StructuralTomeConnector } from './core/StructuralTomeConnector';
import { StructuralSystem } from './core/StructuralSystem';
import { DefaultStructuralConfig } from './core/DefaultStructuralConfig';
import { createTomeConfig } from './core/TomeConfig';
import { createViewStateMachine } from './core/ViewStateMachine';
import { TomeConnector } from './core/TomeConnector';
import GenericEditor from './components/GenericEditor';
import WaveTabs from './components/WaveTabs';
import './index.css';

// Create the main application tome configuration
const AppTomeConfig = createTomeConfig({
  id: 'app-tome',
  name: 'TomeConnector Studio Application',
  description: 'Main application state machine with submachines for each component',
  version: '1.0.0',
  machines: {
    mainApp: {
      id: 'main-app',
      name: 'Main Application Controller',
      description: 'Controls the overall application state and navigation',
      xstateConfig: {
        id: 'main-app',
        initial: 'initializing',
        context: {
          currentRoute: '/',
          activeTab: 'selector',
          navigationHistory: [],
          errorState: null,
          loadingStates: {},
          subMachines: {}
        },
        states: {
          initializing: {
            on: { INITIALIZATION_COMPLETE: 'ready' },
            entry: 'setupSubMachines'
          },
          ready: {
            on: {
              NAVIGATE: 'navigating',
              TAB_CHANGE: 'tabChanging',
              ERROR: 'error',
              SUBMACHINE_EVENT: 'processingSubMachineEvent'
            }
          },
          navigating: {
            on: { NAVIGATION_COMPLETE: 'ready' },
            entry: 'updateRoute'
          },
          tabChanging: {
            on: { TAB_CHANGE_COMPLETE: 'ready' },
            entry: 'updateActiveTab'
          },
          processingSubMachineEvent: {
            on: { SUBMACHINE_EVENT_COMPLETE: 'ready' },
            entry: 'routeToSubMachine'
          },
          error: {
            on: { RECOVER: 'ready', RESET: 'initializing' },
            entry: 'handleError'
          }
        }
      }
    },
    waveTabs: {
      id: 'wave-tabs',
      name: 'Wave Tabs Controller',
      description: 'Manages tab state and navigation',
      xstateConfig: {
        id: 'wave-tabs',
        initial: 'idle',
        context: {
          activeTab: 'selector',
          tabHistory: ['selector'],
          tabs: [
            { id: 'selector', label: 'Selector', icon: '🎯', enabled: true },
            { id: 'settings', label: 'Settings', icon: '⚙️', enabled: true },
            { id: 'about', label: 'About', icon: 'ℹ️', enabled: true }
          ]
        },
        states: {
          idle: {
            on: {
              TAB_SELECT: 'tabSelected',
              TAB_ADD: 'addingTab',
              TAB_REMOVE: 'removingTab'
            }
          },
          tabSelected: {
            on: { TAB_SELECTION_COMPLETE: 'idle' },
            entry: 'updateActiveTab'
          },
          addingTab: {
            on: { TAB_ADDITION_COMPLETE: 'idle' },
            entry: 'addNewTab'
          },
          removingTab: {
            on: { TAB_REMOVAL_COMPLETE: 'idle' },
            entry: 'removeTab'
          }
        }
      }
    },
    selectorInput: {
      id: 'selector-input',
      name: 'Selector Input Controller',
      description: 'Manages selector input state and validation',
      xstateConfig: {
        id: 'selector-input',
        initial: 'idle',
        context: {
          inputValue: '',
          validationState: 'idle',
          suggestions: [],
          history: []
        },
        states: {
          idle: {
            on: {
              INPUT_CHANGE: 'inputting',
              VALIDATE: 'validating',
              CLEAR: 'clearing'
            }
          },
          inputting: {
            on: { INPUT_COMPLETE: 'idle' },
            entry: 'updateInput'
          },
          validating: {
            on: { VALIDATION_COMPLETE: 'idle' },
            entry: 'validateInput'
          },
          clearing: {
            on: { CLEAR_COMPLETE: 'idle' },
            entry: 'clearInput'
          }
        }
      }
    },
    settings: {
      id: 'settings',
      name: 'Settings Controller',
      description: 'Manages application settings and configuration',
      xstateConfig: {
        id: 'settings',
        initial: 'idle',
        context: {
          settings: {},
          unsavedChanges: false,
          currentSection: 'general'
        },
        states: {
          idle: {
            on: {
              LOAD_SETTINGS: 'loading',
              EDIT_SETTING: 'editing',
              SAVE_SETTINGS: 'saving'
            }
          },
          loading: {
            on: { SETTINGS_LOADED: 'idle' },
            entry: 'loadSettings'
          },
          editing: {
            on: { SETTING_CHANGED: 'idle' },
            entry: 'updateSetting'
          },
          saving: {
            on: { SETTINGS_SAVED: 'idle' },
            entry: 'saveSettings'
          }
        }
      }
    },
    about: {
      id: 'about',
      name: 'About Controller',
      description: 'Manages about information and help content',
      xstateConfig: {
        id: 'about',
        initial: 'idle',
        context: {
          expandedSections: [],
          helpTopics: [],
          currentHelpTopic: null
        },
        states: {
          idle: {
            on: {
              EXPAND_SECTION: 'expanding',
              SHOW_HELP: 'showingHelp',
              COLLAPSE_SECTION: 'collapsing'
            }
          },
          expanding: {
            on: { SECTION_EXPANDED: 'idle' },
            entry: 'expandSection'
          },
          showingHelp: {
            on: { HELP_DISPLAYED: 'idle' },
            entry: 'showHelpTopic'
          },
          collapsing: {
            on: { SECTION_COLLAPSED: 'idle' },
            entry: 'collapseSection'
          }
        }
      }
    }
  },
  routing: {
    basePath: '/api/app',
    routes: {
      mainApp: {
        path: '/main',
        method: 'POST'
      },
      waveTabs: {
        path: '/tabs',
        method: 'POST'
      },
      selectorInput: {
        path: '/selector',
        method: 'POST'
      },
      settings: {
        path: '/settings',
        method: 'POST'
      },
      about: {
        path: '/about',
        method: 'POST'
      }
    }
  },
  context: {
    appName: 'TomeConnector Studio',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
});

// Create the structural system with our custom config
const customStructuralConfig = {
  ...DefaultStructuralConfig,
  TomeConfig: {
    tomes: {
      'app-tome': {
        machineId: 'main-app',
        description: 'Main application state machine',
        states: ['initializing', 'ready', 'navigating', 'tabChanging', 'processingSubMachineEvent', 'error'],
        events: ['INITIALIZATION_COMPLETE', 'NAVIGATE', 'TAB_CHANGE', 'ERROR', 'SUBMACHINE_EVENT', 'RECOVER', 'RESET']
      },
      'wave-tabs-tome': {
        machineId: 'wave-tabs',
        description: 'Wave tabs navigation system',
        states: ['idle', 'tabSelected', 'addingTab', 'removingTab'],
        events: ['TAB_SELECT', 'TAB_ADD', 'TAB_REMOVE', 'TAB_SELECTION_COMPLETE', 'TAB_ADDITION_COMPLETE', 'TAB_REMOVAL_COMPLETE']
      },
      'selector-input-tome': {
        machineId: 'selector-input',
        description: 'Selector input management',
        states: ['idle', 'inputting', 'validating', 'clearing'],
        events: ['INPUT_CHANGE', 'VALIDATE', 'CLEAR', 'INPUT_COMPLETE', 'VALIDATION_COMPLETE', 'CLEAR_COMPLETE']
      },
      'settings-tome': {
        machineId: 'settings',
        description: 'Application settings management',
        states: ['idle', 'loading', 'editing', 'saving'],
        events: ['LOAD_SETTINGS', 'EDIT_SETTING', 'SAVE_SETTINGS', 'SETTINGS_LOADED', 'SETTING_CHANGED', 'SETTINGS_SAVED']
      },
      'about-tome': {
        machineId: 'about',
        description: 'About and help information',
        states: ['idle', 'expanding', 'showingHelp', 'collapsing'],
        events: ['EXPAND_SECTION', 'SHOW_HELP', 'COLLAPSE_SECTION', 'SECTION_EXPANDED', 'HELP_DISPLAYED', 'SECTION_COLLAPSED']
      }
    }
  }
};

const structuralSystem = new StructuralSystem(customStructuralConfig);

// Create the main tome connector
const mainTomeConnector = new TomeConnector();

// Main App component with tome integration
const App: React.FC = () => {
  const [appState, setAppState] = useState({
    currentRoute: '/',
    activeTab: 'selector',
    isLoading: true,
    error: null as string | null
  });

  const [mainMachine, setMainMachine] = useState<any>(null);

  // Initialize the main application machine
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Create the main app machine
        const machine = createViewStateMachine({
          machineId: 'main-app',
          xstateConfig: AppTomeConfig.machines.mainApp.xstateConfig,
          tomeConfig: AppTomeConfig
        });

        // Set up state change listener
        machine.on('stateChange', (event: any) => {
          const newState = event.newState || event.state;
          const context = event.context || {};
          
          setAppState(prev => ({
            ...prev,
            currentRoute: context.currentRoute || prev.currentRoute,
            activeTab: context.activeTab || prev.activeTab,
            isLoading: newState === 'initializing',
            error: newState === 'error' ? context.errorState : null
          }));
        });

        // Set up sub-machine event routing
        machine.on('SUBMACHINE_EVENT', async (event: any) => {
          const { targetMachine, eventType, payload } = event;
          
          // Route the event to the appropriate sub-machine
          const subMachine = structuralSystem.getMachine(targetMachine);
          if (subMachine) {
            await subMachine.send({ type: eventType, ...payload });
          }
        });

        // Start the machine
        await machine.start();
        
        // Send initialization complete event
        machine.send({ type: 'INITIALIZATION_COMPLETE' });
        
        setMainMachine(machine);
        
      } catch (error) {
        console.error('Failed to initialize app machine:', error);
        setAppState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }));
      }
    };

    initializeApp();
  }, []);

  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('App-level error:', error, errorInfo);
    
    // Send error event to the main machine
    if (mainMachine) {
      mainMachine.send({ type: 'ERROR', error: error.message, errorInfo });
    }
  };

  const handleTabChange = (tabId: string) => {
    console.log('Tab changed to:', tabId);
    
    // Send tab change event to the main machine
    if (mainMachine) {
      mainMachine.send({ type: 'TAB_CHANGE', tabId });
    }
    
    // Update local state
    setAppState(prev => ({ ...prev, activeTab: tabId }));
  };

  const handleNavigation = (route: string) => {
    // Send navigation event to the main machine
    if (mainMachine) {
      mainMachine.send({ type: 'NAVIGATE', route });
    }
    
    // Update local state
    setAppState(prev => ({ ...prev, currentRoute: route }));
  };

  if (appState.error) {
    return (
      <div className="app error-state">
        <h1>❌ Application Error</h1>
        <p>{appState.error}</p>
        <button onClick={() => window.location.reload()}>Reload Application</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <h1>🔗 TomeConnector Studio</h1>
            <p>Integrated wave-tabs system with state machines and message routing</p>
          </div>
        </nav>

        <main className="app-main">
          <GenericEditor 
            title="TomeConnector Studio"
            description="A powerful platform for building connected, observable applications with state machines, submachines, and distributed tracing."
            onError={handleError}
          >
            {/* Main Application Tome Connector */}
            <StructuralTomeConnector
              componentName="app"
              structuralSystem={structuralSystem}
              initialModel={{
                currentRoute: appState.currentRoute,
                activeTab: appState.activeTab,
                navigationHistory: []
              }}
              onStateChange={(state, model) => {
                console.log('Main app state changed:', state, model);
              }}
              onLogEntry={(entry) => {
                console.log('Main app log entry:', entry);
              }}
              onMachineCreated={(machine) => {
                console.log('Main app machine created:', machine);
              }}
            >
              {({ machine, currentState, model, sendEvent }) => (
                <div className="tome-connected-app">
                  <div className="app-status">
                    <span className="status-indicator">
                      {currentState === 'ready' ? '🟢' : currentState === 'error' ? '🔴' : '🟡'}
                    </span>
                    <span className="status-text">State: {currentState}</span>
                    <span className="route-info">Route: {model.currentRoute}</span>
                  </div>

                  {/* Wave Tabs with Tome Integration */}
                  <StructuralTomeConnector





















































































































































































































































































































































































































































































































componentName="WaveTabs"
                    structuralSystem={structuralSystem}
                    initialModel={{
                      activeTab: appState.activeTab,
                      tabHistory: [appState.activeTab]
                    }}
                    onStateChange={(state, model) => {
                      console.log('Wave tabs state changed:', state, model);
                    }}
                    onLogEntry={(entry) => {
                      console.log('Wave tabs log entry:', entry);
                    }}
                  >
                                         {() => (
                       <WaveTabs 
                         initialActiveTab={appState.activeTab}
                         onTabChange={handleTabChange}
                       />
                     )}
                  </StructuralTomeConnector>

                  {/* Additional Tome Connectors for other components */}
                  <StructuralTomeConnector
                    componentName="SelectorInput"
                    structuralSystem={structuralSystem}
                    initialModel={{
                      inputValue: '',
                      validationState: 'idle',
                      suggestions: []
                    }}
                    onStateChange={(state, model) => {
                      console.log('Selector input state changed:', state, model);
                    }}
                    onLogEntry={(entry) => {
                      console.log('Selector input log entry:', entry);
                    }}
                  >
                    {({ machine: selectorMachine, currentState: selectorState, model: selectorModel, sendEvent: sendSelectorEvent }) => (
                      <div className="selector-tome-status">
                        <small>Selector State: {selectorState}</small>
                      </div>
                    )}
                  </StructuralTomeConnector>

                  <StructuralTomeConnector
                    componentName="settings"
                    structuralSystem={structuralSystem}
                    initialModel={{
                      settings: {},
                      unsavedChanges: false
                    }}
                    onStateChange={(state, model) => {
                      console.log('Settings state changed:', state, model);
                    }}
                    onLogEntry={(entry) => {
                      console.log('Settings log entry:', entry);
                    }}
                  >
                    {({ machine: settingsMachine, currentState: settingsState, model: settingsModel, sendEvent: sendSettingsEvent }) => (
                      <div className="settings-tome-status">
                        <small>Settings State: {settingsState}</small>
                      </div>
                    )}
                  </StructuralTomeConnector>

                  <StructuralTomeConnector
                    componentName="About"
                    structuralSystem={structuralSystem}
                    initialModel={{
                      expandedSections: [],
                      helpTopics: []
                    }}
                    onStateChange={(state, model) => {
                      console.log('About state changed:', state, model);
                    }}
                    onLogEntry={(entry) => {
                      console.log('About log entry:', entry);
                    }}
                  >
                    {({ machine: aboutMachine, currentState: aboutState, model: aboutModel, sendEvent: sendAboutEvent }) => (
                      <div className="about-tome-status">
                        <small>About State: {aboutState}</small>
                      </div>
                    )}
                  </StructuralTomeConnector>
                </div>
              )}
            </StructuralTomeConnector>
          </GenericEditor>
        </main>

        <footer className="app-footer">
          <p>🔗 TomeConnector Studio - Powered by ViewStateMachine, XState & OpenTelemetry</p>
          <div className="footer-status">
            <span>Main Machine: {mainMachine ? '🟢 Active' : '🔴 Inactive'}</span>
            <span>Structural System: 🟢 Active</span>
            <span>Tome Connectors: 🟢 Active</span>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App; 