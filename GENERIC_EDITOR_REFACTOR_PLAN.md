# GenericEditor Refactoring Plan - Tome Architecture with Routed Send

**Date**: October 2025  
**Goal**: Refactor GenericEditor system to use new async routed send capabilities  
**Status**: Planning Phase  
**Estimated Time**: 6-8 hours

---

## 🎯 Objectives

1. Convert editor-server to use Tome architecture with routed send
2. Create EditorTome for state management
3. Implement async services for editor operations
4. Use relative path routing for editor sub-machines
5. Integrate with RobotCopy for distributed messaging
6. Maintain backward compatibility with existing API

---

## 📊 Current Architecture

### Current Components

1. **GenericEditor.tsx** (128 lines)
   - Presentational wrapper component
   - Error boundary with retry
   - Simple header/footer layout
   - **Status**: ✅ Good as-is

2. **editor-server.ts** (964 lines)
   - Express server with REST API
   - Template processing
   - RobotCopy integration
   - Health monitoring
   - Component CRUD operations
   - **Status**: 🔴 Needs Tome refactor

3. **EditorTomeConfig** (in TomeConfig.ts)
   - Basic editor machine config
   - Preview machine config
   - **Status**: 🟡 Needs expansion

### Current Issues

1. **Imperative REST handlers**: Long procedural request handlers
2. **No state machine integration**: Editor logic not in state machines
3. **Manual error handling**: Try/catch everywhere
4. **No routed messaging**: Direct function calls
5. **Tight coupling**: Server logic mixed with Express routing

---

## 🏗️ Proposed Architecture

### New Tome Structure

```
EditorTome (TomeBase)
├── Router (MachineRouter)
├── EditorMachine (ViewStateMachine)
│   ├── States: idle, loading, editing, saving, previewing, error
│   └── Services: loadComponent, saveComponent, previewComponent
├── PreviewMachine (ViewStateMachine)
│   ├── States: idle, rendering, ready, error
│   └── Services: renderPreview, updatePreview
├── TemplateMachine (ViewStateMachine)
│   ├── States: idle, processing, validating, error
│   └── Services: processTemplate, validateTemplate
└── HealthMachine (ViewStateMachine)
    ├── States: healthy, degraded, unhealthy
    └── Services: checkHealth, reportMetrics
```

### Communication Patterns

```typescript
// Editor saves → Preview updates
EditorMachine.saveService:
  await meta.routedSend('./PreviewMachine', 'UPDATE_PREVIEW', { component });

// Preview → Template processing
PreviewMachine.renderService:
  await meta.routedSend('../TemplateMachine', 'PROCESS', { template });

// Health monitoring → Editor notification
HealthMachine.checkService:
  await meta.routedSend('../../EditorMachine', 'HEALTH_UPDATE', { status });
```

---

## 📋 Implementation Steps

### Phase 1: Create EditorTome Foundation (2-3 hours)

#### Step 1.1: Create EditorTome Class
**File**: `src/editor/tomes/EditorTome.ts`

```typescript
import { TomeBase, MachineRouter } from '../core/TomeBase';
import { createEditorMachine } from '../machines/editor-machine';
import { createPreviewMachine } from '../machines/preview-machine';
import { createTemplateMachine } from '../machines/template-machine';
import { createHealthMachine } from '../machines/health-machine';

export class EditorTome extends TomeBase {
    private editorMachine: any;
    private previewMachine: any;
    private templateMachine: any;
    private healthMachine: any;

    async initialize() {
        // Create machines with router
        this.editorMachine = createEditorMachine(this.router);
        this.previewMachine = createPreviewMachine(this.router);
        this.templateMachine = createTemplateMachine(this.router);
        this.healthMachine = createHealthMachine(this.router);

        // Register machines
        this.router.register('EditorMachine', this.editorMachine);
        this.router.register('PreviewMachine', this.previewMachine);
        this.router.register('TemplateMachine', this.templateMachine);
        this.router.register('HealthMachine', this.healthMachine);

        // Set up parent-child relationships
        this.editorMachine.parentMachine = this;
        this.previewMachine.parentMachine = this;
        this.templateMachine.parentMachine = this;
        this.healthMachine.parentMachine = this;

        // Start machines
        await Promise.all([
            this.editorMachine.start(),
            this.previewMachine.start(),
            this.templateMachine.start(),
            this.healthMachine.start()
        ]);

        // Send initialize events
        this.editorMachine.send('INITIALIZE');
        this.healthMachine.send('START_MONITORING');
    }
}
```

#### Step 1.2: Create EditorMachine
**File**: `src/editor/machines/editor-machine.ts`

```typescript
import { createViewStateMachine, ServiceMeta, MachineRouter } from '../core';

export const createEditorMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'editor-machine',
        router: router,
        xstateConfig: {
            initial: 'idle',
            context: {
                currentComponent: null,
                components: [],
                isDirty: false,
                lastSaved: null,
                error: null
            },
            states: {
                idle: {
                    on: {
                        LOAD_COMPONENT: { target: 'loading' },
                        CREATE_NEW: { target: 'editing' }
                    }
                },
                loading: {
                    invoke: {
                        src: 'loadComponentService',
                        onDone: { target: 'editing', actions: ['setComponent'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                editing: {
                    on: {
                        SAVE: { target: 'saving' },
                        PREVIEW: { target: 'previewing' },
                        CANCEL: { target: 'idle' },
                        COMPONENT_CHANGE: { actions: ['markDirty'] }
                    }
                },
                saving: {
                    invoke: {
                        src: 'saveComponentService',
                        onDone: { target: 'editing', actions: ['markSaved'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                previewing: {
                    invoke: {
                        src: 'previewComponentService',
                        onDone: { target: 'editing' },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'editing' },
                        RESET: { target: 'idle', actions: ['resetEditor'] }
                    }
                }
            },
            services: {
                loadComponentService: async (context, event, meta: ServiceMeta) => {
                    console.log('Loading component:', event.componentId);
                    
                    // Use routed send to fetch from API or storage machine
                    if (meta.routedSend) {
                        const response = await meta.routedSend(
                            '../StorageMachine',
                            'GET_COMPONENT',
                            { id: event.componentId }
                        );
                        return response.component;
                    }
                    
                    // Fallback to direct load
                    return await loadComponentFromStorage(event.componentId);
                },
                
                saveComponentService: async (context, event, meta: ServiceMeta) => {
                    console.log('Saving component:', context.currentComponent);
                    
                    // Notify preview machine about save
                    if (meta.routedSend) {
                        await meta.routedSend(
                            '../PreviewMachine',
                            'COMPONENT_SAVED',
                            { component: context.currentComponent }
                        );
                    }
                    
                    // Save to storage
                    const result = await saveComponentToStorage(context.currentComponent);
                    
                    return result;
                },
                
                previewComponentService: async (context, event, meta: ServiceMeta) => {
                    console.log('Requesting preview:', context.currentComponent);
                    
                    // Send to preview machine
                    if (meta.routedSend) {
                        const response = await meta.routedSend(
                            '../PreviewMachine',
                            'RENDER_PREVIEW',
                            { component: context.currentComponent }
                        );
                        return response;
                    }
                    
                    throw new Error('Preview machine not available');
                }
            },
            actions: {
                setComponent: (context, event) => {
                    context.currentComponent = event.data;
                    context.isDirty = false;
                },
                markDirty: (context) => {
                    context.isDirty = true;
                },
                markSaved: (context) => {
                    context.isDirty = false;
                    context.lastSaved = Date.now();
                },
                setError: (context, event) => {
                    context.error = event.data;
                },
                resetEditor: (context) => {
                    context.currentComponent = null;
                    context.isDirty = false;
                    context.error = null;
                }
            }
        }
    });
};
```

#### Step 1.3: Create PreviewMachine
**File**: `src/editor/machines/preview-machine.ts`

```typescript
export const createPreviewMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'preview-machine',
        router: router,
        xstateConfig: {
            initial: 'idle',
            context: {
                previewData: null,
                isRendering: false,
                error: null
            },
            states: {
                idle: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering', actions: ['updatePreviewData'] }
                    }
                },
                rendering: {
                    invoke: {
                        src: 'renderPreviewService',
                        onDone: { target: 'ready', actions: ['setPreviewData'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                ready: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        UPDATE_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering' },
                        CLEAR: { target: 'idle', actions: ['clearPreview'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'rendering' },
                        RESET: { target: 'idle', actions: ['resetPreview'] }
                    }
                }
            },
            services: {
                renderPreviewService: async (context, event, meta: ServiceMeta) => {
                    console.log('Rendering preview...');
                    
                    // Send to template machine for processing
                    if (meta.routedSend) {
                        const response = await meta.routedSend(
                            '../TemplateMachine',
                            'PROCESS_TEMPLATE',
                            { component: event.component || context.previewData }
                        );
                        return response.processed;
                    }
                    
                    // Fallback to direct rendering
                    return await renderComponentPreview(event.component);
                }
            },
            actions: {
                updatePreviewData: (context, event) => {
                    context.previewData = event.component;
                },
                setPreviewData: (context, event) => {
                    context.previewData = event.data;
                },
                setError: (context, event) => {
                    context.error = event.data;
                },
                clearPreview: (context) => {
                    context.previewData = null;
                },
                resetPreview: (context) => {
                    context.previewData = null;
                    context.error = null;
                }
            }
        }
    });
};
```

---

### Phase 2: Refactor editor-server.ts (2-3 hours)

#### Step 2.1: Convert REST Handlers to Tome Services

**Current Pattern** (editor-server.ts):
```typescript
// REST endpoint with procedural logic
app.post('/api/editor/save', async (req, res) => {
    try {
        const component = req.body;
        const result = await saveComponent(component);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**New Pattern** (with Tome):
```typescript
// Thin REST handler that routes to Tome
app.post('/api/editor/save', async (req, res) => {
    const response = await editorTome.send('EditorMachine', 'SAVE', req.body);
    res.json(response);
});

// Logic now in EditorMachine service
services: {
    saveComponentService: async (context, event, meta: ServiceMeta) => {
        // Notify preview
        await meta.routedSend('../PreviewMachine', 'COMPONENT_SAVED', event);
        
        // Notify health monitor
        await meta.routedSend('../HealthMachine', 'OPERATION_COMPLETE', {
            operation: 'save',
            duration: Date.now() - event.startTime
        });
        
        // Save to storage
        return await saveToStorage(context.currentComponent);
    }
}
```

#### Step 2.2: Convert Template Processor to TemplateMachine

**Current**: Class with static methods  
**New**: State machine with services

```typescript
export const createTemplateMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'template-machine',
        router: router,
        xstateConfig: {
            states: {
                idle: {
                    on: {
                        PROCESS_TEMPLATE: { target: 'processing' }
                    }
                },
                processing: {
                    invoke: {
                        src: 'processTemplateService',
                        onDone: { target: 'validated' },
                        onError: { target: 'error' }
                    }
                },
                validated: {
                    invoke: {
                        src: 'validateTemplateService',
                        onDone: { target: 'idle', actions: ['returnResult'] },
                        onError: { target: 'error' }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'processing' },
                        RESET: { target: 'idle' }
                    }
                }
            },
            services: {
                processTemplateService: async (context, event, meta: ServiceMeta) => {
                    const processed = processTemplate(event.template, event.variables);
                    
                    // Notify editor of processing complete
                    if (meta.routedSend) {
                        await meta.routedSend('..', 'TEMPLATE_PROCESSED', { 
                            result: processed 
                        });
                    }
                    
                    return processed;
                },
                validateTemplateService: async (context, event, meta: ServiceMeta) => {
                    // Validation logic
                    return validateTemplate(event.data);
                }
            }
        }
    });
};
```

#### Step 2.3: Create HealthMachine for Monitoring

```typescript
export const createHealthMachine = (router?: MachineRouter) => {
    return createViewStateMachine({
        machineId: 'health-machine',
        router: router,
        xstateConfig: {
            initial: 'idle',
            context: {
                metrics: {
                    requestCount: 0,
                    errorCount: 0,
                    avgResponseTime: 0,
                    uptime: 0
                },
                status: 'unknown'
            },
            states: {
                idle: {
                    on: {
                        START_MONITORING: { target: 'monitoring' }
                    }
                },
                monitoring: {
                    invoke: {
                        src: 'monitoringService'
                    },
                    on: {
                        OPERATION_COMPLETE: { actions: ['recordMetric'] },
                        OPERATION_FAILED: { actions: ['recordError'] },
                        CHECK_HEALTH: { target: 'checking' },
                        STOP_MONITORING: { target: 'idle' }
                    }
                },
                checking: {
                    invoke: {
                        src: 'checkHealthService',
                        onDone: { target: 'monitoring', actions: ['updateStatus'] },
                        onError: { target: 'monitoring', actions: ['markUnhealthy'] }
                    }
                },
                unhealthy: {
                    on: {
                        RECOVER: { target: 'monitoring' },
                        STOP: { target: 'idle' }
                    }
                }
            },
            services: {
                monitoringService: (context, event) => (send) => {
                    // Set up interval monitoring
                    const interval = setInterval(() => {
                        send('CHECK_HEALTH');
                    }, 30000); // Check every 30s

                    return () => clearInterval(interval);
                },
                checkHealthService: async (context, event, meta: ServiceMeta) => {
                    const metrics = context.metrics;
                    
                    // Determine health status
                    const status = determineHealthStatus(metrics);
                    
                    // Notify other machines if status changed
                    if (status !== context.status && meta.routedSend) {
                        await meta.routedSend('../EditorMachine', 'HEALTH_STATUS_CHANGED', {
                            status,
                            metrics
                        });
                    }
                    
                    return { status, metrics };
                }
            },
            actions: {
                recordMetric: (context, event) => {
                    context.metrics.requestCount++;
                    // Update avgResponseTime
                },
                recordError: (context, event) => {
                    context.metrics.errorCount++;
                },
                updateStatus: (context, event) => {
                    context.status = event.data.status;
                },
                markUnhealthy: (context, event) => {
                    context.status = 'unhealthy';
                }
            }
        }
    });
};
```

---

### Phase 3: Refactor Express Routes (1-2 hours)

#### Step 3.1: Create Thin Route Handlers
**File**: `src/editor-server.ts` (refactored)

```typescript
import express from 'express';
import { EditorTome } from './editor/tomes/EditorTome';

const app = express();
const editorTome = new EditorTome();

// Initialize tome
await editorTome.initialize();

// Thin REST handlers that delegate to Tome
app.get('/api/editor/components', async (req, res) => {
    try {
        const response = await editorTome.send('EditorMachine', 'LIST_COMPONENTS');
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/editor/components', async (req, res) => {
    try {
        editorTome.send('EditorMachine', 'LOAD_COMPONENT', req.body);
        // Wait for state transition
        const result = await waitForState(editorTome, 'EditorMachine', 'editing');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/editor/components/:id', async (req, res) => {
    try {
        editorTome.send('EditorMachine', 'SAVE', req.body);
        const result = await waitForState(editorTome, 'EditorMachine', 'editing');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/editor/preview/:id', async (req, res) => {
    try {
        const response = await editorTome.send('PreviewMachine', 'RENDER_PREVIEW', {
            componentId: req.params.id
        });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', async (req, res) => {
    try {
        const health = await editorTome.send('HealthMachine', 'GET_STATUS');
        res.json(health);
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});
```

---

### Phase 4: Add React Integration (1-2 hours)

#### Step 4.1: Create EditorTomeConnector Hook
**File**: `src/editor/hooks/useEditorTome.ts`

```typescript
import { useState, useEffect } from 'react';
import { EditorTome } from '../tomes/EditorTome';

export const useEditorTome = () => {
    const [editorState, setEditorState] = useState('idle');
    const [currentComponent, setCurrentComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const tome = new EditorTome();
        
        tome.initialize().then(() => {
            // Subscribe to editor state changes
            tome.observeViewKey((key) => {
                setEditorState(key);
            });
        });

        return () => tome.cleanup();
    }, []);

    const loadComponent = (componentId: string) => {
        EditorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId });
    };

    const saveComponent = (component: any) => {
        EditorTome.send('EditorMachine', 'SAVE', { component });
    };

    const previewComponent = () => {
        EditorTome.send('EditorMachine', 'PREVIEW');
    };

    return {
        editorState,
        currentComponent,
        error,
        loadComponent,
        saveComponent,
        previewComponent
    };
};
```

#### Step 4.2: Update GenericEditor Component
**File**: `src/components/GenericEditor.tsx`

```typescript
import React, { ReactNode } from 'react';
import { useEditorTome } from '../editor/hooks/useEditorTome';

interface GenericEditorProps {
  title: string;
  description: string;
  children?: ReactNode;
  componentId?: string;
  onError?: (error: Error) => void;
}

const GenericEditor: React.FC<GenericEditorProps> = ({ 
  title, 
  description, 
  children,
  componentId,
  onError 
}) => {
  const {
    editorState,
    currentComponent,
    error,
    loadComponent,
    saveComponent,
    previewComponent
  } = useEditorTome();

  // Auto-load if componentId provided
  useEffect(() => {
    if (componentId) {
      loadComponent(componentId);
    }
  }, [componentId]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div className="generic-editor" data-state={editorState}>
      <header className="editor-header">
        <h1 className="editor-title">{title}</h1>
        <p className="editor-description">{description}</p>
        <div className="editor-status">
          State: {editorState}
        </div>
      </header>
      
      <main className="editor-main">
        <ErrorBoundary onError={onError}>
          {children || renderEditorContent(currentComponent, editorState)}
        </ErrorBoundary>
      </main>
      
      <footer className="editor-footer">
        <button onClick={() => saveComponent(currentComponent)} disabled={editorState !== 'editing'}>
          💾 Save
        </button>
        <button onClick={previewComponent} disabled={editorState !== 'editing'}>
          👁️ Preview
        </button>
        <p>🔗 TomeConnector & ViewStateMachine | State: {editorState}</p>
      </footer>
    </div>
  );
};
```

---

## 📝 Detailed Task List

### Phase 1: Foundation
- [ ] Create `src/editor/` directory structure
- [ ] Create `EditorTome.ts` class extending TomeBase
- [ ] Create `editor-machine.ts` with CRUD operations
- [ ] Create `preview-machine.ts` for preview rendering
- [ ] Create `template-machine.ts` for template processing
- [ ] Create `health-machine.ts` for monitoring
- [ ] Wire up machines with router
- [ ] Test machine initialization

### Phase 2: Server Refactor
- [ ] Identify all REST endpoints in editor-server.ts
- [ ] Create services for each operation
- [ ] Convert endpoints to thin handlers
- [ ] Remove procedural logic from routes
- [ ] Add error handling via machine states
- [ ] Test API endpoints

### Phase 3: Integration
- [ ] Create `useEditorTome` hook
- [ ] Update GenericEditor component
- [ ] Add state-based rendering
- [ ] Add action buttons (save, preview)
- [ ] Test React integration

### Phase 4: Testing
- [ ] Write unit tests for each machine
- [ ] Write integration tests for machine communication
- [ ] Test routed send between machines
- [ ] Test relative paths (../PreviewMachine, etc.)
- [ ] Test error scenarios
- [ ] Test health monitoring

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('EditorMachine', () => {
    it('should transition from idle to loading when LOAD_COMPONENT sent', async () => {
        const machine = createEditorMachine();
        await machine.start();
        
        machine.send('LOAD_COMPONENT', { componentId: '123' });
        
        // Wait for transition
        await waitFor(() => machine.getState().value === 'loading');
        
        expect(machine.getState().value).toBe('loading');
    });
    
    it('should use routed send to communicate with PreviewMachine', async () => {
        const router = new MachineRouter();
        const editorMachine = createEditorMachine(router);
        const previewMachine = createPreviewMachine(router);
        
        router.register('EditorMachine', editorMachine);
        router.register('PreviewMachine', previewMachine);
        
        const previewSpy = jest.spyOn(previewMachine, 'send');
        
        await editorMachine.start();
        editorMachine.send('PREVIEW');
        
        expect(previewSpy).toHaveBeenCalledWith('RENDER_PREVIEW', expect.any(Object));
    });
});
```

### Integration Tests

```typescript
describe('EditorTome Integration', () => {
    it('should coordinate between editor and preview machines', async () => {
        const editorTome = new EditorTome();
        await editorTome.initialize();
        
        // Load component in editor
        editorTome.send('EditorMachine', 'LOAD_COMPONENT', { id: '123' });
        await waitFor(() => getState(editorTome, 'EditorMachine') === 'editing');
        
        // Request preview
        editorTome.send('EditorMachine', 'PREVIEW');
        
        // Verify preview machine received event
        await waitFor(() => getState(editorTome, 'PreviewMachine') === 'rendering');
        
        expect(getState(editorTome, 'PreviewMachine')).toBe('rendering');
    });
});
```

---

## 🎨 Benefits

### Code Quality
1. **Separation of Concerns**: Business logic in machines, HTTP in routes
2. **Testability**: Mock machines easily, test logic independently
3. **Maintainability**: State transitions explicit and documented
4. **Reusability**: Machines can be used in different contexts

### Architecture
5. **Async Coordination**: Services communicate via routed send
6. **Loose Coupling**: Machines don't know implementation details
7. **Scalability**: Add new machines without changing existing ones
8. **Observability**: State transitions logged automatically

### Developer Experience
9. **Type Safety**: ServiceMeta provides proper TypeScript types
10. **Debugging**: State machine visualizations show flow
11. **Error Handling**: Centralized in machine states
12. **Hot Reload**: Machines can be updated without server restart

---

## 🔄 Migration Strategy

### Phase A: Parallel Implementation (Recommended)
1. Create new Tome architecture alongside existing server
2. Add feature flag: `USE_TOME_ARCHITECTURE=true`
3. Route to new or old handlers based on flag
4. Gradually migrate endpoints
5. Remove old code when stable

### Phase B: Direct Replacement (Riskier)
1. Replace all at once
2. Extensive testing required
3. Higher risk but cleaner result

**Recommendation**: Use Phase A for safer migration

---

## 📊 Success Metrics

### Technical Metrics
- [ ] All core tests passing (117/117+)
- [ ] New editor tests passing (20+ new tests)
- [ ] No performance degradation (<5% overhead)
- [ ] TypeScript errors: 0
- [ ] Code coverage: >80% for new code

### Functional Metrics
- [ ] All API endpoints work identically
- [ ] State transitions occur correctly
- [ ] Routed send between machines works
- [ ] Error handling improved
- [ ] Health monitoring functional

### Code Quality
- [ ] Reduced cyclomatic complexity
- [ ] Fewer lines of procedural code
- [ ] Better separation of concerns
- [ ] Improved testability

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes to API
**Mitigation**: Integration tests, feature flags, gradual rollout

### Risk 2: Performance Overhead
**Mitigation**: Benchmark before/after, optimize hot paths

### Risk 3: Complex Debugging
**Mitigation**: Enhanced logging, state visualizations, dev tools

### Risk 4: Learning Curve
**Mitigation**: Documentation, examples, pair programming

---

## 🗓️ Timeline

- **Phase 1** (Foundation): 2-3 hours
- **Phase 2** (Server Refactor): 2-3 hours
- **Phase 3** (Integration): 1-2 hours
- **Phase 4** (Testing): 1 hour
- **Total**: 6-9 hours (1 day)

---

## 🏁 Implementation Checklist

### Prerequisites
- [x] Routed send implemented in log-view-machine v1.4.0
- [x] Core tests passing (117/117)
- [x] ServiceMeta types exported
- [ ] Example tests separated

### Phase 1
- [ ] Create editor directory structure
- [ ] Implement EditorTome
- [ ] Implement EditorMachine
- [ ] Implement PreviewMachine
- [ ] Implement TemplateMachine
- [ ] Implement HealthMachine

### Phase 2
- [ ] Refactor editor-server.ts
- [ ] Convert REST handlers
- [ ] Test API compatibility

### Phase 3
- [ ] Create useEditorTome hook
- [ ] Update GenericEditor component
- [ ] Add UI controls

### Phase 4
- [ ] Write machine unit tests
- [ ] Write integration tests
- [ ] Write end-to-end tests

---

## 📚 Files to Create

```
log-view-machine/
├── src/
│   └── editor/
│       ├── tomes/
│       │   └── EditorTome.ts
│       ├── machines/
│       │   ├── editor-machine.ts
│       │   ├── preview-machine.ts
│       │   ├── template-machine.ts
│       │   └── health-machine.ts
│       ├── hooks/
│       │   └── useEditorTome.ts
│       └── services/
│           ├── storage-service.ts
│           ├── template-service.ts
│           └── validation-service.ts
└── src/__tests__/editor/
    ├── EditorTome.test.ts
    ├── editor-machine.test.ts
    ├── preview-machine.test.ts
    ├── integration.test.ts
    └── routed-send.test.ts
```

---

## 🎯 Example: Before & After

### Before (Procedural)
```typescript
app.post('/api/editor/save', async (req, res) => {
    try {
        const component = req.body;
        
        // Validate
        if (!component.id || !component.content) {
            throw new Error('Invalid component');
        }
        
        // Save
        const saved = await db.save(component);
        
        // Update preview
        await updatePreview(saved);
        
        // Record metrics
        metrics.recordSave();
        
        // Notify subscribers
        robotCopy.broadcast('component-saved', saved);
        
        res.json({ success: true, data: saved });
    } catch (error) {
        metrics.recordError();
        res.status(500).json({ error: error.message });
    }
});
```

### After (Tome Architecture)
```typescript
// Route handler (thin)
app.post('/api/editor/save', async (req, res) => {
    const response = await editorTome.send('EditorMachine', 'SAVE', req.body);
    res.json(response);
});

// Machine service (business logic)
services: {
    saveComponentService: async (context, event, meta: ServiceMeta) => {
        // Notify preview machine to update
        await meta.routedSend('../PreviewMachine', 'COMPONENT_SAVED', event);
        
        // Notify health machine
        await meta.routedSend('../HealthMachine', 'OPERATION_COMPLETE', {
            operation: 'save',
            duration: Date.now() - event.startTime
        });
        
        // Save and return
        return await saveComponent(context.currentComponent);
    }
}
```

**Benefits**:
- Logic extracted from HTTP layer
- Testable without Express
- Reusable in other contexts
- Better error handling
- Automatic coordination

---

## 🚀 Next Steps

1. Review this plan
2. Create feature branch: `feature/editor-tome-refactor`
3. Implement Phase 1
4. Test and iterate
5. Continue through phases
6. Merge when complete

---

**Plan Status**: ✅ Ready for Implementation  
**Priority**: Medium (after v1.4.0 release)  
**Risk Level**: Low-Medium (well-isolated feature)  
**Impact**: High (demonstrates routed send in real-world scenario)

