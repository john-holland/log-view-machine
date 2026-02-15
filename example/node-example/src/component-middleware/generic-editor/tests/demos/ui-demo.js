/**
 * Generic Editor UI Flow Demo
 * 
 * This demo showcases the complete UI flow for the generic editor including:
 * - dotCMS login and authentication
 * - Component search and selection
 * - Semantic version management
 * - Dynamic component loading and unloading
 * - State machine integration
 * - SASS identity management
 */

import { createGenericEditorUI } from './ui.js';

/**
 * Enhanced Generic Editor UI Demo
 */
export async function runGenericEditorUIDemo() {
  console.log('🎨 Starting Enhanced Generic Editor UI Demo...');
  
  const genericEditorUI = createGenericEditorUI({
    dotCMSUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
    dotCMSApiKey: process.env.DOTCMS_API_KEY || 'demo-key',
    enableXStateVisualizer: true,
    enableSunEditor: true,
    enableAceEditor: true,
    enableReactDnD: true,
    enableSASSIdentityManagement: true,
    enableComponentIdentity: true,
    enableStyleManagement: true
  });

  try {
    // Initialize UI
    await genericEditorUI.initialize();
    console.log('✅ Generic Editor UI initialized');

    // Demo 1: dotCMS Login Flow
    await demoDotCMSLoginFlow(genericEditorUI);
    
    // Demo 2: Component Search and Selection
    await demoComponentSearchAndSelection(genericEditorUI);
    
    // Demo 3: Version Management
    await demoVersionManagement(genericEditorUI);
    
    // Demo 4: Dynamic Component Loading
    await demoDynamicComponentLoading(genericEditorUI);
    
    // Demo 5: State Machine Integration
    await demoStateMachineIntegration(genericEditorUI);
    
    // Demo 6: SASS Identity Management
    await demoSASSIdentityManagement(genericEditorUI);
    
    // Demo 7: Component Unloading
    await demoComponentUnloading(genericEditorUI);
    
    // Demo 8: Logout Flow
    await demoLogoutFlow(genericEditorUI);

    console.log('🎉 Enhanced Generic Editor UI Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Generic Editor UI Demo failed:', error);
    throw error;
  }
}

/**
 * Demo 1: dotCMS Login Flow
 */
async function demoDotCMSLoginFlow(genericEditorUI) {
  console.log('\n🔐 Demo 1: dotCMS Login Flow');
  
  // Test successful login
  console.log('  📝 Testing successful login...');
  
  const loginResult = await genericEditorUI.loginToDotCMS({
    username: 'admin',
    password: 'password'
  });
  
  if (loginResult.success) {
    console.log(`  ✅ Login successful: ${loginResult.user.name}`);
    console.log(`    - Role: ${loginResult.user.role}`);
    console.log(`    - Permissions: ${loginResult.user.permissions.join(', ')}`);
    console.log(`    - Workspace: ${loginResult.user.workspace}`);
  } else {
    console.log(`  ❌ Login failed: ${loginResult.error}`);
  }
  
  // Test failed login
  console.log('  📝 Testing failed login...');
  
  const failedLoginResult = await genericEditorUI.loginToDotCMS({
    username: 'invalid',
    password: 'wrong'
  });
  
  if (!failedLoginResult.success) {
    console.log(`  ✅ Failed login handled correctly: ${failedLoginResult.error}`);
  }
  
  // Test developer login
  console.log('  📝 Testing developer login...');
  
  const devLoginResult = await genericEditorUI.loginToDotCMS({
    username: 'developer',
    password: 'dev123'
  });
  
  if (devLoginResult.success) {
    console.log(`  ✅ Developer login successful: ${devLoginResult.user.name}`);
    console.log(`    - Role: ${devLoginResult.user.role}`);
    console.log(`    - Permissions: ${devLoginResult.user.permissions.join(', ')}`);
  }
  
  // Get current state
  const currentState = genericEditorUI.getCurrentState();
  console.log(`  📊 Current state:`);
  console.log(`    - Authenticated: ${currentState.isAuthenticated}`);
  console.log(`    - Current user: ${currentState.currentUser?.name || 'None'}`);
  console.log(`    - Loading: ${currentState.isLoading}`);
  console.log(`    - Error: ${currentState.error || 'None'}`);
}

/**
 * Demo 2: Component Search and Selection
 */
async function demoComponentSearchAndSelection(genericEditorUI) {
  console.log('\n🔍 Demo 2: Component Search and Selection');
  
  // Search all components
  console.log('  📝 Searching all components...');
  
  const allComponents = await genericEditorUI.searchComponents();
  console.log(`  ✅ Found ${allComponents.length} components:`);
  
  for (const component of allComponents) {
    console.log(`    - ${component.name} (${component.type}) - ${component.description}`);
  }
  
  // Search by type
  console.log('  📝 Searching button components...');
  
  const buttonComponents = await genericEditorUI.searchComponents('button');
  console.log(`  ✅ Found ${buttonComponents.length} button components`);
  
  // Search by description
  console.log('  📝 Searching form components...');
  
  const formComponents = await genericEditorUI.searchComponents('form');
  console.log(`  ✅ Found ${formComponents.length} form components`);
  
  // Select default component
  console.log('  📝 Selecting default empty container component...');
  
  try {
    const selectionResult = await genericEditorUI.selectComponent('default-empty-container');
    console.log(`  ✅ Selected component: ${selectionResult.component.name}`);
    console.log(`    - Type: ${selectionResult.component.type}`);
    console.log(`    - Versions: ${selectionResult.component.semanticVersions.join(', ')}`);
  } catch (error) {
    console.log(`  ❌ Failed to select component: ${error.message}`);
  }
  
  // Select button component
  console.log('  📝 Selecting button component...');
  
  try {
    const buttonSelectionResult = await genericEditorUI.selectComponent('button-component');
    console.log(`  ✅ Selected component: ${buttonSelectionResult.component.name}`);
    console.log(`    - Template: ${buttonSelectionResult.component.template.substring(0, 50)}...`);
    console.log(`    - State machine: ${buttonSelectionResult.component.stateMachine.name}`);
  } catch (error) {
    console.log(`  ❌ Failed to select button component: ${error.message}`);
  }
}

/**
 * Demo 3: Version Management
 */
async function demoVersionManagement(genericEditorUI) {
  console.log('\n📦 Demo 3: Version Management');
  
  // Get versions for button component
  console.log('  📝 Getting versions for button component...');
  
  try {
    const versions = genericEditorUI.getComponentVersions('button-component');
    console.log(`  ✅ Button component versions: ${versions.join(', ')}`);
    
    // Select specific version
    console.log('  📝 Selecting version 2.0.0...');
    
    const versionResult = await genericEditorUI.selectComponentVersion('button-component', '2.0.0');
    console.log(`  ✅ Selected version: ${versionResult.version}`);
    console.log(`    - Component: ${versionResult.component.name}`);
    
  } catch (error) {
    console.log(`  ❌ Version management failed: ${error.message}`);
  }
  
  // Get versions for form component
  console.log('  📝 Getting versions for form component...');
  
  try {
    const formVersions = genericEditorUI.getComponentVersions('form-component');
    console.log(`  ✅ Form component versions: ${formVersions.join(', ')}`);
    
    // Select latest version
    const latestVersion = formVersions[formVersions.length - 1];
    console.log(`  📝 Selecting latest version: ${latestVersion}`);
    
    const formVersionResult = await genericEditorUI.selectComponentVersion('form-component', latestVersion);
    console.log(`  ✅ Selected form version: ${formVersionResult.version}`);
    
  } catch (error) {
    console.log(`  ❌ Form version management failed: ${error.message}`);
  }
  
  // Test invalid version
  console.log('  📝 Testing invalid version selection...');
  
  try {
    await genericEditorUI.selectComponentVersion('button-component', '9.9.9');
    console.log(`  ❌ Should have failed with invalid version`);
  } catch (error) {
    console.log(`  ✅ Correctly handled invalid version: ${error.message}`);
  }
}

/**
 * Demo 4: Dynamic Component Loading
 */
async function demoDynamicComponentLoading(genericEditorUI) {
  console.log('\n🔄 Demo 4: Dynamic Component Loading');
  
  // Load button component with version 1.0.0
  console.log('  📝 Loading button component v1.0.0...');
  
  try {
    const loadResult = await genericEditorUI.loadComponentWithVersion('button-component', '1.0.0');
    console.log(`  ✅ Loaded component: ${loadResult.component.name} v${loadResult.version}`);
    console.log(`    - SASS Identity: ${loadResult.sassIdentity.name}`);
    console.log(`    - XState Config: ${loadResult.xstateConfig.name}`);
    console.log(`    - SASS compiled: ${loadResult.sassResult.css.length} characters`);
    console.log(`    - SASS validation: ${loadResult.validationResult.valid ? 'Passed' : 'Failed'}`);
    
    if (loadResult.validationResult.warnings.length > 0) {
      console.log(`    - SASS warnings: ${loadResult.validationResult.warnings.join(', ')}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Failed to load button component: ${error.message}`);
  }
  
  // Load card component with version 1.2.0
  console.log('  📝 Loading card component v1.2.0...');
  
  try {
    const cardLoadResult = await genericEditorUI.loadComponentWithVersion('card-component', '1.2.0');
    console.log(`  ✅ Loaded card component: ${cardLoadResult.component.name} v${cardLoadResult.version}`);
    console.log(`    - SASS Identity: ${cardLoadResult.sassIdentity.name}`);
    console.log(`    - XState Config: ${cardLoadResult.xstateConfig.name}`);
    
  } catch (error) {
    console.log(`  ❌ Failed to load card component: ${error.message}`);
  }
  
  // Test loading with invalid component
  console.log('  📝 Testing loading invalid component...');
  
  try {
    await genericEditorUI.loadComponentWithVersion('invalid-component', '1.0.0');
    console.log(`  ❌ Should have failed with invalid component`);
  } catch (error) {
    console.log(`  ✅ Correctly handled invalid component: ${error.message}`);
  }
}

/**
 * Demo 5: State Machine Integration
 */
async function demoStateMachineIntegration(genericEditorUI) {
  console.log('\n⚡ Demo 5: State Machine Integration');
  
  // Load form component to get state machine
  console.log('  📝 Loading form component for state machine integration...');
  
  try {
    const formLoadResult = await genericEditorUI.loadComponentWithVersion('form-component', '2.0.0');
    const stateMachine = formLoadResult.xstateConfig;
    
    console.log(`  ✅ Form state machine: ${stateMachine.name}`);
    console.log(`    - ID: ${stateMachine.id}`);
    console.log(`    - Version: ${stateMachine.version}`);
    console.log(`    - Status: ${stateMachine.status}`);
    
    // Analyze state machine states
    const states = Object.keys(stateMachine.config.states);
    console.log(`    - States: ${states.join(', ')}`);
    
    // Show state transitions
    console.log(`    - State transitions:`);
    for (const [stateName, stateConfig] of Object.entries(stateMachine.config.states)) {
      if (stateConfig.on) {
        const transitions = Object.keys(stateConfig.on);
        console.log(`      ${stateName}: ${transitions.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ State machine integration failed: ${error.message}`);
  }
  
  // Test state machine creation
  console.log('  📝 Testing state machine creation...');
  
  try {
    const customStateMachine = genericEditorUI.genericEditor.createXStateConfiguration({
      id: 'custom-state-machine',
      name: 'Custom State Machine',
      config: {
        id: 'customState',
        initial: 'start',
        states: {
          start: {
            on: { NEXT: 'processing' }
          },
          processing: {
            on: { COMPLETE: 'end' }
          },
          end: {
            type: 'final'
          }
        }
      },
      version: '1.0.0'
    });
    
    console.log(`  ✅ Created custom state machine: ${customStateMachine.name}`);
    console.log(`    - ID: ${customStateMachine.id}`);
    console.log(`    - Version: ${customStateMachine.version}`);
    
  } catch (error) {
    console.log(`  ❌ Custom state machine creation failed: ${error.message}`);
  }
}

/**
 * Demo 6: SASS Identity Management
 */
async function demoSASSIdentityManagement(genericEditorUI) {
  console.log('\n🎨 Demo 6: SASS Identity Management');
  
  // Create SASS component identity
  console.log('  📝 Creating SASS component identity...');
  
  try {
    const sassIdentity = genericEditorUI.genericEditor.createSASSComponentIdentity({
      id: 'custom-sass-identity',
      name: 'Custom SASS Identity',
      semanticVersion: '1.0.0',
      componentType: 'custom',
      sassVariables: {
        'primary-color': '#ff6b6b',
        'secondary-color': '#4ecdc4',
        'accent-color': '#45b7d1',
        'background-color': '#f7f7f7',
        'text-color': '#2c3e50'
      },
      sassMixins: [
        '@mixin custom-button($color) { background-color: $color; border-radius: 8px; padding: 12px 24px; }',
        '@mixin custom-shadow { box-shadow: 0 4px 8px rgba(0,0,0,0.15); }',
        '@mixin custom-transition { transition: all 0.3s ease-in-out; }'
      ],
      sassFunctions: [
        '@function custom-spacing($base, $multiplier) { @return $base * $multiplier; }',
        '@function custom-color($base, $opacity) { @return rgba($base, $opacity); }'
      ],
      themeVariants: [
        { name: 'light', description: 'Light theme variant' },
        { name: 'dark', description: 'Dark theme variant' },
        { name: 'colorful', description: 'Colorful theme variant' }
      ]
    });
    
    console.log(`  ✅ Created SASS identity: ${sassIdentity.name}`);
    console.log(`    - Version: ${sassIdentity.semanticVersion}`);
    console.log(`    - Type: ${sassIdentity.componentType}`);
    console.log(`    - Variables: ${Object.keys(sassIdentity.sassVariables).length}`);
    console.log(`    - Mixins: ${sassIdentity.sassMixins.length}`);
    console.log(`    - Functions: ${sassIdentity.sassFunctions.length}`);
    console.log(`    - Theme variants: ${sassIdentity.themeVariants.length}`);
    
    // Compile SASS
    console.log('  📝 Compiling SASS...');
    
    const sassResult = await genericEditorUI.genericEditor.compileSASSForIdentity(sassIdentity.id);
    console.log(`  ✅ Compiled SASS: ${sassResult.css.length} characters`);
    console.log(`    - Duration: ${sassResult.stats.duration}ms`);
    
    // Validate SASS
    console.log('  📝 Validating SASS...');
    
    const validationResult = await genericEditorUI.genericEditor.validateSASSForIdentity(sassIdentity.id);
    console.log(`  ✅ SASS validation: ${validationResult.valid ? 'Passed' : 'Failed'}`);
    
    if (validationResult.warnings.length > 0) {
      console.log(`    - Warnings: ${validationResult.warnings.join(', ')}`);
    }
    
    // Update SASS identity
    console.log('  📝 Updating SASS identity...');
    
    const updatedIdentity = genericEditorUI.genericEditor.updateSASSComponentIdentity(sassIdentity.id, {
      sassVariables: {
        ...sassIdentity.sassVariables,
        'new-color': '#ff8c42'
      },
      themeVariants: [
        ...sassIdentity.themeVariants,
        { name: 'minimal', description: 'Minimal theme variant' }
      ]
    });
    
    console.log(`  ✅ Updated SASS identity: ${updatedIdentity.name}`);
    console.log(`    - New variables: ${Object.keys(updatedIdentity.sassVariables).length}`);
    console.log(`    - New theme variants: ${updatedIdentity.themeVariants.length}`);
    
  } catch (error) {
    console.log(`  ❌ SASS identity management failed: ${error.message}`);
  }
}

/**
 * Demo 7: Component Unloading
 */
async function demoComponentUnloading(genericEditorUI) {
  console.log('\n🔄 Demo 7: Component Unloading');
  
  // Check current component
  const currentState = genericEditorUI.getCurrentState();
  console.log(`  📊 Current state before unloading:`);
  console.log(`    - Current component: ${currentState.currentComponent?.name || 'None'}`);
  console.log(`    - Current version: ${currentState.currentVersion || 'None'}`);
  console.log(`    - Current state machine: ${currentState.currentStateMachine?.name || 'None'}`);
  
  // Unload current component
  console.log('  📝 Unloading current component...');
  
  try {
    await genericEditorUI.unloadCurrentComponent();
    console.log(`  ✅ Component unloaded successfully`);
    
    // Check state after unloading
    const newState = genericEditorUI.getCurrentState();
    console.log(`  📊 State after unloading:`);
    console.log(`    - Current component: ${newState.currentComponent?.name || 'None'}`);
    console.log(`    - Current version: ${newState.currentVersion || 'None'}`);
    console.log(`    - Current state machine: ${newState.currentStateMachine?.name || 'None'}`);
    
  } catch (error) {
    console.log(`  ❌ Component unloading failed: ${error.message}`);
  }
  
  // Test unloading when no component is loaded
  console.log('  📝 Testing unloading when no component is loaded...');
  
  try {
    await genericEditorUI.unloadCurrentComponent();
    console.log(`  ✅ Gracefully handled unloading when no component was loaded`);
  } catch (error) {
    console.log(`  ❌ Failed to handle unloading when no component was loaded: ${error.message}`);
  }
}

/**
 * Demo 8: Logout Flow
 */
async function demoLogoutFlow(genericEditorUI) {
  console.log('\n🚪 Demo 8: Logout Flow');
  
  // Check current authentication state
  const currentState = genericEditorUI.getCurrentState();
  console.log(`  📊 Current authentication state:`);
  console.log(`    - Authenticated: ${currentState.isAuthenticated}`);
  console.log(`    - Current user: ${currentState.currentUser?.name || 'None'}`);
  
  // Logout
  console.log('  📝 Logging out...');
  
  try {
    const logoutResult = await genericEditorUI.logout();
    console.log(`  ✅ Logout successful: ${logoutResult.message}`);
    
    // Check state after logout
    const newState = genericEditorUI.getCurrentState();
    console.log(`  📊 State after logout:`);
    console.log(`    - Authenticated: ${newState.isAuthenticated}`);
    console.log(`    - Current user: ${newState.currentUser?.name || 'None'}`);
    console.log(`    - Current component: ${newState.currentComponent?.name || 'None'}`);
    
  } catch (error) {
    console.log(`  ❌ Logout failed: ${error.message}`);
  }
  
  // Test logout when not authenticated
  console.log('  📝 Testing logout when not authenticated...');
  
  try {
    await genericEditorUI.logout();
    console.log(`  ✅ Gracefully handled logout when not authenticated`);
  } catch (error) {
    console.log(`  ❌ Failed to handle logout when not authenticated: ${error.message}`);
  }
}

/**
 * Integration with Fish Burger Backend
 */
export async function integrateWithFishBurger(genericEditorUI) {
  console.log('\n🍔 Integrating with Fish Burger Backend...');
  
  // Login as admin
  await genericEditorUI.loginToDotCMS({
    username: 'admin',
    password: 'password'
  });
  
  // Create fish burger specific component
  const fishBurgerComponent = {
    id: 'fish-burger-order-form',
    name: 'Fish Burger Order Form',
    description: 'Order form component for fish burger application',
    type: 'form',
    semanticVersions: ['1.0.0'],
    template: `
      <form class="fish-burger-form" data-component-id="{{componentId}}">
        <div class="form-group">
          <label>Fish Type</label>
          <select class="form-control" name="fishType">
            <option value="salmon">Salmon</option>
            <option value="tuna">Tuna</option>
            <option value="cod">Cod</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" class="form-control" name="quantity" min="1" max="10" />
        </div>
        <button type="submit" class="btn btn-primary">Order Fish Burger</button>
      </form>
    `,
    styles: `
      .fish-burger-form { max-width: 500px; margin: 20px auto; padding: 20px; }
      .fish-burger-form .form-group { margin-bottom: 15px; }
      .fish-burger-form .form-control { width: 100%; padding: 10px; border: 1px solid #ddd; }
      .fish-burger-form .btn { background: #28a745; color: white; padding: 12px 24px; }
    `,
    stateMachine: {
      id: 'fish-burger-order-state',
      name: 'Fish Burger Order State Machine',
      config: {
        id: 'fishBurgerOrder',
        initial: 'idle',
        states: {
          idle: {
            on: { START_ORDER: 'ordering' }
          },
          ordering: {
            on: { SUBMIT_ORDER: 'processing' }
          },
          processing: {
            on: { ORDER_SUCCESS: 'success', ORDER_FAILED: 'error' }
          },
          success: {
            on: { RESET: 'idle' }
          },
          error: {
            on: { RETRY: 'ordering', RESET: 'idle' }
          }
        }
      }
    },
    metadata: {
      author: 'Fish Burger Team',
      created: new Date().toISOString(),
      tags: ['fish-burger', 'order', 'form']
    }
  };
  
  // Add component to generic editor
  genericEditorUI.genericEditor.components.set(fishBurgerComponent.id, fishBurgerComponent);
  
  // Select and load fish burger component
  await genericEditorUI.selectComponent('fish-burger-order-form');
  const loadResult = await genericEditorUI.loadComponentWithVersion('fish-burger-order-form', '1.0.0');
  
  console.log(`  🔗 Created fish burger component: ${loadResult.component.name}`);
  console.log(`    - Version: ${loadResult.version}`);
  console.log(`    - SASS Identity: ${loadResult.sassIdentity.name}`);
  console.log(`    - State Machine: ${loadResult.xstateConfig.name}`);
  
  return {
    component: loadResult.component,
    version: loadResult.version,
    sassIdentity: loadResult.sassIdentity,
    xstateConfig: loadResult.xstateConfig,
    user: genericEditorUI.currentUser
  };
} 