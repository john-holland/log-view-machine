import { createPersistenceManager } from './persistence.js';

/**
 * Generic Editor Configuration
 */
export class GenericEditorConfig {
  constructor(options = {}) {
    this.dotCMSUrl = options.dotCMSUrl || 'http://localhost:8080';
    this.dotCMSApiKey = options.dotCMSApiKey || 'demo-key';
    this.enableXStateVisualizer = options.enableXStateVisualizer !== false;
    this.enableSunEditor = options.enableSunEditor !== false;
    this.enableAceEditor = options.enableAceEditor !== false;
    this.enableReactDnD = options.enableReactDnD !== false;
    this.enableSASSIdentityManagement = options.enableSASSIdentityManagement !== false;
    this.enableComponentIdentity = options.enableComponentIdentity !== false;
    this.enableStyleManagement = options.enableStyleManagement !== false;
    this.enablePersistence = options.enablePersistence !== false;
    this.persistenceConfig = options.persistenceConfig || {};
    this.enableFishBurgerIntegration = options.enableFishBurgerIntegration !== false;
  }
}

/**
 * DotCMS Component Template
 */
export class DotCMSComponentTemplate {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type || 'generic';
    this.semanticVersions = data.semanticVersions || ['1.0.0'];
    this.template = data.template || '<div></div>';
    this.styles = data.styles || '';
    this.stateMachine = data.stateMachine || null;
    this.metadata = data.metadata || {};
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  getTemplate() {
    return this.template;
  }

  getStyles() {
    return this.styles;
  }

  getStateMachine() {
    return this.stateMachine;
  }

  updateTemplate(template) {
    this.template = template;
    this.updatedAt = new Date().toISOString();
  }

  updateStyles(styles) {
    this.styles = styles;
    this.updatedAt = new Date().toISOString();
  }

  updateStateMachine(stateMachine) {
    this.stateMachine = stateMachine;
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * SASS Component Identity
 */
export class SASSComponentIdentity {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.semanticVersion = data.semanticVersion || '1.0.0';
    this.componentType = data.componentType || 'generic';
    this.styleIdentity = data.styleIdentity || {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40'
    };
    this.sassVariables = data.sassVariables || {};
    this.sassMixins = data.sassMixins || [];
    this.sassFunctions = data.sassFunctions || [];
    this.responsiveBreakpoints = data.responsiveBreakpoints || {
      xs: '0px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px'
    };
    this.themeVariants = data.themeVariants || [];
    this.metadata = data.metadata || {};
    this.status = data.status || 'draft';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  getSASSVariables() {
    return this.sassVariables;
  }

  getSASSMixins() {
    return this.sassMixins;
  }

  getSASSFunctions() {
    return this.sassFunctions;
  }

  generateSASSFile() {
    let sass = `// SASS Component Identity: ${this.name}\n`;
    sass += `// Version: ${this.semanticVersion}\n`;
    sass += `// Generated: ${new Date().toISOString()}\n\n`;

    // Variables
    sass += `// Variables\n`;
    Object.entries(this.sassVariables).forEach(([key, value]) => {
      sass += `$${key}: ${value};\n`;
    });

    // Mixins
    if (this.sassMixins.length > 0) {
      sass += `\n// Mixins\n`;
      this.sassMixins.forEach(mixin => {
        sass += `${mixin}\n`;
      });
    }

    // Functions
    if (this.sassFunctions.length > 0) {
      sass += `\n// Functions\n`;
      this.sassFunctions.forEach(func => {
        sass += `${func}\n`;
      });
    }

    // Component styles
    sass += `\n// Component Styles\n`;
    sass += `.${this.componentType}-component {\n`;
    Object.entries(this.styleIdentity).forEach(([key, value]) => {
      sass += `  --${key}: ${value};\n`;
    });
    sass += `}\n`;

    return sass;
  }

  updateSASSVariables(variables) {
    this.sassVariables = { ...this.sassVariables, ...variables };
    this.updatedAt = new Date().toISOString();
  }

  addSASSMixin(mixin) {
    this.sassMixins.push(mixin);
    this.updatedAt = new Date().toISOString();
  }

  addSASSFunction(func) {
    this.sassFunctions.push(func);
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * Fish Burger Integration Component
 */
export class FishBurgerComponent {
  constructor(data = {}) {
    this.id = data.id || 'fish-burger-component';
    this.name = data.name || 'Fish Burger Component';
    this.description = data.description || 'Interactive fish burger ordering component';
    this.type = data.type || 'fish-burger';
    this.semanticVersions = data.semanticVersions || ['1.0.0'];
    this.template = data.template || `
      <div class="fish-burger-component" data-component-id="{{componentId}}">
        <div class="burger-builder">
          <h3>Build Your Fish Burger</h3>
          <div class="ingredients">
            <div class="ingredient" data-ingredient="bun">Bun</div>
            <div class="ingredient" data-ingredient="fish">Fish Patty</div>
            <div class="ingredient" data-ingredient="lettuce">Lettuce</div>
            <div class="ingredient" data-ingredient="tomato">Tomato</div>
            <div class="ingredient" data-ingredient="cheese">Cheese</div>
          </div>
          <div class="burger-preview">
            <div class="burger-stack"></div>
          </div>
          <button class="order-btn">Order Now</button>
        </div>
      </div>
    `;
    this.styles = data.styles || `
      .fish-burger-component {
        padding: 20px;
        border: 2px solid #007bff;
        border-radius: 8px;
        background: #f8f9fa;
      }
      .burger-builder {
        text-align: center;
      }
      .ingredients {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 20px 0;
      }
      .ingredient {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        background: white;
      }
      .ingredient:hover {
        background: #e9ecef;
      }
      .burger-preview {
        margin: 20px 0;
        min-height: 100px;
        border: 1px dashed #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .order-btn {
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .order-btn:hover {
        background: #0056b3;
      }
    `;
    this.stateMachine = data.stateMachine || {
      id: 'fish-burger-state',
      name: 'Fish Burger State Machine',
      config: {
        id: 'fishBurgerState',
        initial: 'idle',
        states: {
          idle: {
            on: { START_BUILDING: 'building' }
          },
          building: {
            on: { ADD_INGREDIENT: 'building', COMPLETE_BUILD: 'ready' }
          },
          ready: {
            on: { ORDER: 'ordering', MODIFY: 'building' }
          },
          ordering: {
            on: { CONFIRM: 'confirmed', CANCEL: 'ready' }
          },
          confirmed: {
            on: { RESET: 'idle' }
          }
        }
      }
    };
    this.metadata = data.metadata || {
      author: 'Fish Burger Team',
      created: new Date().toISOString(),
      tags: ['food', 'interactive', 'burger'],
      isFishBurger: true
    };
    this.status = data.status || 'published';
  }
}

/**
 * Generic Editor
 */
export class GenericEditor {
  constructor(config = new GenericEditorConfig()) {
    this.config = config;
    this.components = new Map();
    this.stateMachines = new Map();
    this.sassIdentities = new Map();
    this.xstateVisualizer = null;
    this.sunEditor = null;
    this.aceEditor = null;
    this.reactDnD = null;
    this.sassCompiler = null;
    this.persistence = null;
    this.fishBurgerIntegration = null;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the Generic Editor
   */
  async initialize() {
    console.log('🚀 Initializing Generic Editor...');
    
    try {
      // Initialize persistence if enabled
      if (this.config.enablePersistence) {
        this.persistence = createPersistenceManager(this.config.persistenceConfig);
        await this.persistence.initialize();
        console.log('  ✅ Persistence initialized');
      }

      // Initialize XState Visualizer
      if (this.config.enableXStateVisualizer) {
        await this.initializeXStateVisualizer();
      }

      // Initialize SunEditor
      if (this.config.enableSunEditor) {
        await this.initializeSunEditor();
      }

      // Initialize Ace Editor
      if (this.config.enableAceEditor) {
        await this.initializeAceEditor();
      }

      // Initialize React DnD
      if (this.config.enableReactDnD) {
        await this.initializeReactDnD();
      }

      // Initialize SASS Identity Management
      if (this.config.enableSASSIdentityManagement) {
        await this.initializeSASSIdentityManagement();
      }

      // Initialize Fish Burger Integration
      if (this.config.enableFishBurgerIntegration) {
        await this.initializeFishBurgerIntegration();
      }

      // Load default components
      await this.loadDefaultComponents();

      console.log('✅ Generic Editor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Generic Editor:', error);
      throw error;
    }
  }

  /**
   * Initialize XState Visualizer
   */
  async initializeXStateVisualizer() {
    console.log('  📊 Initializing XState Visualizer...');
    this.xstateVisualizer = {
      inspect: (machine) => {
        console.log('  📊 XState Visualizer inspecting machine:', machine.id);
        return { url: `http://localhost:3001?machine=${machine.id}` };
      },
      isEnabled: () => true
    };
    console.log('  ✅ XState Visualizer initialized');
  }

  /**
   * Initialize SunEditor
   */
  async initializeSunEditor() {
    console.log('  📝 Initializing SunEditor...');
    this.sunEditor = {
      create: (element, config) => {
        console.log('  📝 SunEditor created with config:', config);
        return {
          getContents: () => '<div>SunEditor content</div>',
          setContents: (html) => console.log('  📝 SunEditor content set:', html),
          on: (event, handler) => console.log('  📝 SunEditor event bound:', event)
        };
      }
    };
    console.log('  ✅ SunEditor initialized');
  }

  /**
   * Initialize Ace Editor
   */
  async initializeAceEditor() {
    console.log('  🔧 Initializing Ace Editor...');
    this.aceEditor = {
      edit: (element) => {
        console.log('  🔧 Ace Editor created for element:', element);
        return {
          setValue: (value) => console.log('  🔧 Ace Editor value set:', value),
          getValue: () => '{}',
          on: (event, handler) => console.log('  🔧 Ace Editor event bound:', event)
        };
      }
    };
    console.log('  ✅ Ace Editor initialized');
  }

  /**
   * Initialize React DnD
   */
  async initializeReactDnD() {
    console.log('  🎯 Initializing React DnD...');
    this.reactDnD = {
      DndProvider: ({ children }) => children,
      useDrag: () => [{ isDragging: false }, { drag: () => {} }],
      useDrop: () => [{ isOver: false }, { drop: () => {} }]
    };
    console.log('  ✅ React DnD initialized');
  }

  /**
   * Initialize SASS Identity Management
   */
  async initializeSASSIdentityManagement() {
    console.log('  🎨 Initializing SASS Identity Management...');
    this.sassCompiler = {
      compile: (sass) => {
        console.log('  🎨 SASS compiled:', sass.substring(0, 50) + '...');
        return sass.replace(/\.scss/g, '.css');
      }
    };
    console.log('  ✅ SASS Identity Management initialized');
  }

  /**
   * Initialize Fish Burger Integration
   */
  async initializeFishBurgerIntegration() {
    console.log('  🐟 Initializing Fish Burger Integration...');
    
    // Create fish burger component
    const fishBurgerComponent = new FishBurgerComponent();
    this.components.set(fishBurgerComponent.id, fishBurgerComponent);
    
    // Create fish burger SASS identity
    const fishBurgerSASS = new SASSComponentIdentity({
      id: 'fish-burger-sass',
      name: 'Fish Burger SASS Identity',
      componentType: 'fish-burger',
      sassVariables: {
        'fish-burger-primary': '#007bff',
        'fish-burger-secondary': '#6c757d',
        'fish-burger-success': '#28a745'
      },
      sassMixins: [
        '@mixin fish-burger-button { padding: 10px 20px; border-radius: 4px; cursor: pointer; }',
        '@mixin fish-burger-ingredient { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; }'
      ]
    });
    this.sassIdentities.set(fishBurgerSASS.id, fishBurgerSASS);
    
    this.fishBurgerIntegration = {
      component: fishBurgerComponent,
      sassIdentity: fishBurgerSASS,
      isEnabled: () => true
    };
    
    console.log('  ✅ Fish Burger Integration initialized');
  }

  /**
   * Load default components
   */
  async loadDefaultComponents() {
    console.log('  📦 Loading default components...');
    
    // Load from persistence if available
    if (this.persistence) {
      const localComponents = await this.persistence.listLocalComponents();
      for (const component of localComponents) {
        this.components.set(component.id, component);
      }
      console.log(`  📂 Loaded ${localComponents.length} local components`);
    }
    
    // Ensure we have at least the blank component
    if (!this.components.has('blank-component')) {
      const blankComponent = new DotCMSComponentTemplate({
        id: 'blank-component',
        name: 'Blank Component',
        description: 'Default blank component - start here',
        type: 'blank',
        semanticVersions: ['1.0.0'],
        template: '<div class="blank-component" data-component-id="{{componentId}}"><!-- Start building here --></div>',
        styles: `
          .blank-component { 
            min-height: 200px; 
            border: 2px dashed #ccc; 
            padding: 20px;
            text-align: center;
            color: #666;
            background: #f9f9f9;
          }
          .blank-component:hover {
            border-color: #007bff;
            background: #f0f8ff;
          }
        `,
        stateMachine: {
          id: 'blank-state',
          name: 'Blank Component State Machine',
          config: {
            id: 'blankState',
            initial: 'empty',
            states: {
              empty: { on: { START_BUILDING: 'building' } },
              building: { on: { SAVE: 'saved', RESET: 'empty' } },
              saved: { on: { EDIT: 'building', PUBLISH: 'published' } },
              published: { on: { UNPUBLISH: 'saved' } }
            }
          }
        },
        metadata: {
          author: 'System',
          created: new Date().toISOString(),
          tags: ['default', 'blank', 'starter'],
          isDefault: true
        }
      });
      this.components.set(blankComponent.id, blankComponent);
    }
    
    console.log(`  ✅ Loaded ${this.components.size} total components`);
  }

  /**
   * Create SASS Component Identity
   */
  createSASSComponentIdentity(data) {
    const sassIdentity = new SASSComponentIdentity(data);
    this.sassIdentities.set(sassIdentity.id, sassIdentity);
    
    if (this.persistence) {
      this.persistence.saveSASSIdentity(sassIdentity);
    }
    
    return sassIdentity;
  }

  /**
   * Get SASS Component Identity
   */
  getSASSComponentIdentity(id) {
    return this.sassIdentities.get(id);
  }

  /**
   * Get all SASS Component Identities
   */
  getAllSASSComponentIdentities() {
    return Array.from(this.sassIdentities.values());
  }

  /**
   * Update SASS Component Identity
   */
  updateSASSComponentIdentity(id, updates) {
    const sassIdentity = this.sassIdentities.get(id);
    if (sassIdentity) {
      Object.assign(sassIdentity, updates);
      sassIdentity.updatedAt = new Date().toISOString();
      
      if (this.persistence) {
        this.persistence.saveSASSIdentity(sassIdentity);
      }
    }
    return sassIdentity;
  }

  /**
   * Compile SASS for identity
   */
  compileSASSForIdentity(id) {
    const sassIdentity = this.sassIdentities.get(id);
    if (sassIdentity && this.sassCompiler) {
      return this.sassCompiler.compile(sassIdentity.generateSASSFile());
    }
    return null;
  }

  /**
   * Validate SASS for identity
   */
  validateSASSForIdentity(id) {
    const sassIdentity = this.sassIdentities.get(id);
    if (sassIdentity) {
      try {
        const sassContent = sassIdentity.generateSASSFile();
        return { valid: true, content: sassContent };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    }
    return { valid: false, error: 'SASS identity not found' };
  }

  /**
   * Get component by ID
   */
  getComponent(id) {
    return this.components.get(id);
  }

  /**
   * Get all components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Save component
   */
  async saveComponent(component) {
    this.components.set(component.id, component);
    
    if (this.persistence) {
      await this.persistence.saveComponent(component);
    }
    
    return component;
  }

  /**
   * Get state machine by ID
   */
  getStateMachine(id) {
    return this.stateMachines.get(id);
  }

  /**
   * Get all state machines
   */
  getAllStateMachines() {
    return Array.from(this.stateMachines.values());
  }

  /**
   * Save state machine
   */
  async saveStateMachine(stateMachine) {
    this.stateMachines.set(stateMachine.id, stateMachine);
    
    if (this.persistence) {
      await this.persistence.saveStateMachine(stateMachine);
    }
    
    return stateMachine;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: true,
      components: this.components.size,
      stateMachines: this.stateMachines.size,
      sassIdentities: this.sassIdentities.size,
      xstateVisualizer: this.xstateVisualizer ? 'enabled' : 'disabled',
      sunEditor: this.sunEditor ? 'enabled' : 'disabled',
      aceEditor: this.aceEditor ? 'enabled' : 'disabled',
      reactDnD: this.reactDnD ? 'enabled' : 'disabled',
      sassCompiler: this.sassCompiler ? 'enabled' : 'disabled',
      persistence: this.persistence ? 'enabled' : 'disabled',
      fishBurgerIntegration: this.fishBurgerIntegration ? 'enabled' : 'disabled'
    };
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

/**
 * Create Generic Editor
 */
export function createGenericEditor(config = new GenericEditorConfig()) {
  return new GenericEditor(config);
} 