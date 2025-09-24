import React, { useEffect, useState, useRef, useMemo, ReactNode } from 'react';
import { ViewStateMachine } from './ViewStateMachine';
import { StructuralSystem } from './StructuralSystem';

// Props for the structural tome connector
interface StructuralTomeConnectorProps {
  componentName: string;
  structuralSystem: StructuralSystem;
  initialModel?: any;
  onStateChange?: (state: string, model: any) => void;
  onLogEntry?: (entry: any) => void;
  onMachineCreated?: (machine: ViewStateMachine<any>) => void;
  children?: ReactNode | ((context: TomeConnectorContext) => ReactNode);
}

// Context provided to children
export interface TomeConnectorContext {
  machine: ViewStateMachine<any> | null;
  currentState: string;
  model: any;
  logEntries: any[];
  isLoading: boolean;
  error: string | null;
  sendEvent: (event: any) => void;
  updateModel: (updates: any) => void;
  componentName: string;
  tomeConfig: any;
  componentMapping: any;
}

// Internal state
interface TomeConnectorState {
  machine: ViewStateMachine<any> | null;
  currentState: string;
  model: any;
  logEntries: any[];
  isLoading: boolean;
  error: string | null;
}

// Main component
export const StructuralTomeConnector: React.FC<StructuralTomeConnectorProps> = ({
  componentName,
  structuralSystem,
  initialModel = {},
  onStateChange,
  onLogEntry,
  onMachineCreated,
  children
}) => {
  const [state, setState] = useState<TomeConnectorState>({
    machine: null,
    currentState: 'idle',
    model: initialModel,
    logEntries: [],
    isLoading: true,
    error: null
  });

  const machineRef = useRef<ViewStateMachine<any> | null>(null);
  const logEntriesRef = useRef<any[]>([]);

  // Get tome configuration and component mapping
  const tomeConfig = useMemo(() => {
    return structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
  }, [componentName, structuralSystem]);

  const componentMapping = useMemo(() => {
    return structuralSystem.getComponentTomeMapping()[componentName];
  }, [componentName, structuralSystem]);

  // Initialize the tome machine
  useEffect(() => {
    const initializeTome = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Validate configuration
        if (!tomeConfig) {
          throw new Error(`No tome configuration found for component: ${componentName}`);
        }

        if (!componentMapping) {
          throw new Error(`No component mapping found for: ${componentName}`);
        }

        // Create or get the machine
        let machine: ViewStateMachine<any> | null = structuralSystem.getMachine(componentName) || null;
        if (!machine) {
          machine = structuralSystem.createMachine(componentName, initialModel);
          if (!machine) {
            throw new Error(`Failed to create machine for component: ${componentName}`);
          }
        }

        // Store machine reference
        machineRef.current = machine;
        onMachineCreated?.(machine);

        // Set up state change listener
        const unsubscribe = machine.subscribe((state: any) => {
          const currentState = state.value || 'idle';
          const model = state.context?.model || initialModel;
          
          setState(prev => ({
            ...prev,
            currentState,
            model,
            isLoading: false
          }));

          onStateChange?.(currentState, model);
        });

        // Set up logging
        machine.on('LOG_ADDED', async (entry: any) => {
          const newEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: 'info',
            message: entry.message,
            metadata: entry.metadata
          };

          setState(prev => ({
            ...prev,
            logEntries: [...prev.logEntries, newEntry]
          }));

          logEntriesRef.current = [...logEntriesRef.current, newEntry];
          onLogEntry?.(newEntry);
        });

        // Initialize the machine
        await machine.start();

        setState(prev => ({
          ...prev,
          machine,
          isLoading: false
        }));

        return unsubscribe;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
        console.error(`Failed to initialize tome for ${componentName}:`, error);
      }
    };

    initializeTome();
  }, [componentName, structuralSystem, initialModel, onStateChange, onLogEntry, onMachineCreated]);

  // Send event to the machine
  const sendEvent = (event: any) => {
    if (machineRef.current) {
      machineRef.current.send(event);
    }
  };

  // Update the model
  const updateModel = (updates: any) => {
    if (machineRef.current) {
      const currentModel = machineRef.current.getState()?.context?.model || {};
      const newModel = { ...currentModel, ...updates };
      
      // Update the machine context
      machineRef.current.send({
        type: 'MODEL_UPDATE',
        payload: { model: newModel }
      });
    }
  };

  // Context value for children
  const contextValue: TomeConnectorContext = {
    machine: state.machine,
    currentState: state.currentState,
    model: state.model,
    logEntries: state.logEntries,
    isLoading: state.isLoading,
    error: state.error,
    sendEvent,
    updateModel,
    componentName,
    tomeConfig,
    componentMapping
  };

  // Render children
  if (typeof children === 'function') {
    return <>{children(contextValue)}</>;
  }

  return (
    <div className="structural-tome-connector">
      <TomeHeader context={contextValue} />
      <TomeContent context={contextValue}>
        {children}
      </TomeContent>
      <TomeFooter context={contextValue} />
    </div>
  );
};

// Tome header component
const TomeHeader: React.FC<{ context: TomeConnectorContext }> = ({ context }) => {
  const { componentName, currentState, tomeConfig, error } = context;

  return (
    <header className="tome-header">
      <div className="tome-info">
        <h3 className="tome-title">{componentName}</h3>
        {tomeConfig && (
          <p className="tome-description">{tomeConfig.description}</p>
        )}
      </div>
      <div className="tome-status">
        <span className={`state-indicator state-${currentState}`}>
          {currentState}
        </span>
        {error && (
          <span className="error-indicator" title={error}>
            ⚠️
          </span>
        )}
      </div>
    </header>
  );
};

// Tome content component
const TomeContent: React.FC<{ 
  context: TomeConnectorContext; 
  children?: ReactNode 
}> = ({ context, children }) => {
  const { isLoading, error } = context;

  if (isLoading) {
    return (
      <div className="tome-content loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tome-content error">
        <div className="error-message">
          <h4>Error</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tome-content">
      {children}
    </div>
  );
};

// Tome footer component
const TomeFooter: React.FC<{ context: TomeConnectorContext }> = ({ context }) => {
  const { logEntries, tomeConfig } = context;

  if (!tomeConfig || logEntries.length === 0) {
    return null;
  }

  return (
    <footer className="tome-footer">
      <details className="tome-logs">
        <summary>Logs ({logEntries.length})</summary>
        <div className="log-entries">
          {logEntries.slice(-5).map(entry => (
            <div key={entry.id} className={`log-entry log-${entry.level}`}>
              <span className="log-timestamp">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-message">{entry.message}</span>
              {entry.metadata && (
                <span className="log-metadata">
                  {JSON.stringify(entry.metadata)}
                </span>
              )}
            </div>
          ))}
        </div>
      </details>
    </footer>
  );
};

// Hook for using the tome connector
export function useStructuralTomeConnector(
  componentName: string,
  structuralSystem: StructuralSystem
): TomeConnectorContext {
  const [context, setContext] = useState<TomeConnectorContext>({
    machine: null,
    currentState: 'idle',
    model: {},
    logEntries: [],
    isLoading: true,
    error: null,
    sendEvent: () => {},
    updateModel: () => {},
    componentName,
    tomeConfig: null,
    componentMapping: null
  });

  useEffect(() => {
    const tomeConfig = structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
    const componentMapping = structuralSystem.getComponentTomeMapping()[componentName];
    
    setContext(prev => ({
      ...prev,
      tomeConfig,
      componentMapping
    }));
  }, [componentName, structuralSystem]);

  return context;
}

// Export the component and types
export default StructuralTomeConnector;
