/**
 * Generic Editor Demo with dotCMS Integration
 * 
 * This demo showcases the complete generic editor integration including:
 * - dotCMS component loading and management
 * - XState visualizer integration
 * - SunEditor for HTML/CSS editing
 * - Ace Editor for JSON configuration
 * - React DnD for workflow creation
 * - Versioning and review workflow
 * - Component template management
 */

import { createGenericEditor } from './index.js';

/**
 * Enhanced Generic Editor Demo with Advanced Features
 */
export async function runGenericEditorDemo() {
  console.log('🚀 Starting Enhanced Generic Editor Demo...');
  
  const genericEditor = createGenericEditor({
    dotCMSUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
    dotCMSApiKey: process.env.DOTCMS_API_KEY || 'demo-key',
    dotCMSWorkspace: process.env.DOTCMS_WORKSPACE || 'default',
    enableXStateVisualizer: true,
    enableSunEditor: true,
    enableAceEditor: true,
    enableReactDnD: true,
    enableVersioning: true,
    enableReviewWorkflow: true
  });

  try {
    // Initialize editor
    await genericEditor.initialize();
    console.log('✅ Generic Editor initialized');

    // Demo 1: dotCMS Integration
    await demoDotCMSIntegration(genericEditor);
    
    // Demo 2: Component Template Management
    await demoComponentTemplateManagement(genericEditor);
    
    // Demo 3: XState Visualizer Integration
    await demoXStateVisualizerIntegration(genericEditor);
    
    // Demo 4: SunEditor Integration
    await demoSunEditorIntegration(genericEditor);
    
    // Demo 5: Ace Editor Integration
    await demoAceEditorIntegration(genericEditor);
    
    // Demo 6: React DnD Workflow Creation
    await demoReactDnDWorkflowCreation(genericEditor);
    
    // Demo 7: Versioning and Review Workflow
    await demoVersioningAndReviewWorkflow(genericEditor);
    
    // Demo 8: Integration with Fish Burger
    await demoFishBurgerIntegration(genericEditor);

    console.log('🎉 Enhanced Generic Editor Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Generic Editor Demo failed:', error);
    throw error;
  }
}

/**
 * Demo 1: dotCMS Integration
 */
async function demoDotCMSIntegration(genericEditor) {
  console.log('\n📦 Demo 1: dotCMS Integration');
  
  // Load components from dotCMS
  console.log('  📦 Loading components from dotCMS...');
  const components = await genericEditor.loadComponents();
  console.log(`  ✅ Loaded ${components.length} components from dotCMS`);
  
  // Load state machines from dotCMS
  console.log('  ⚡ Loading state machines from dotCMS...');
  const stateMachines = await genericEditor.loadStateMachines();
  console.log(`  ✅ Loaded ${stateMachines.length} state machines from dotCMS`);
  
  // Display component details
  components.forEach(component => {
    console.log(`  📋 Component: ${component.name}`);
    console.log(`    - ID: ${component.id}`);
    console.log(`    - Version: ${component.semanticVersion}`);
    console.log(`    - Status: ${component.status}`);
    console.log(`    - Compatible State Machines: ${component.compatibleStateMachines.length}`);
  });
  
  // Display state machine details
  stateMachines.forEach(stateMachine => {
    console.log(`  ⚡ State Machine: ${stateMachine.name}`);
    console.log(`    - ID: ${stateMachine.id}`);
    console.log(`    - Version: ${stateMachine.version}`);
    console.log(`    - Status: ${stateMachine.status}`);
    console.log(`    - States: ${Object.keys(stateMachine.config.states).length}`);
  });
}

/**
 * Demo 2: Component Template Management
 */
async function demoComponentTemplateManagement(genericEditor) {
  console.log('\n📋 Demo 2: Component Template Management');
  
  // Get all components
  const components = genericEditor.getAllComponents();
  
  for (const component of components) {
    console.log(`  📋 Managing component: ${component.name}`);
    
    // Show template with variables
    const templateWithVars = component.getTemplateWithVariables({
      title: 'Custom Title',
      formId: 'custom-form',
      emailPlaceholder: 'Custom placeholder',
      submitText: 'Custom Submit'
    });
    
    console.log(`    - Template with variables: ${templateWithVars.length} characters`);
    
    // Add compatible state machine
    component.addCompatibleStateMachine('new-state-machine');
    console.log(`    - Added compatible state machine`);
    
    // Update status
    component.updateStatus('review', 'demo-user');
    console.log(`    - Updated status to: ${component.status}`);
  }
  
  // Create new component template
  const newComponent = {
    id: 'user-profile',
    name: 'User Profile',
    semanticVersion: '1.0.0',
    template: `
      <div class="user-profile" data-component="user-profile">
        <h2>{{title}}</h2>
        <div class="profile-info">
          <input type="text" placeholder="{{namePlaceholder}}" data-field="name" />
          <input type="email" placeholder="{{emailPlaceholder}}" data-field="email" />
          <button type="button" data-action="save-profile">{{saveText}}</button>
        </div>
      </div>
    `,
    variables: {
      title: 'User Profile',
      namePlaceholder: 'Enter your name',
      emailPlaceholder: 'Enter your email',
      saveText: 'Save Profile'
    },
    defaultData: {
      name: '',
      email: '',
      isSaving: false
    },
    compatibleStateMachines: ['user-profile-state-machine'],
    status: 'draft'
  };
  
  console.log(`  ✅ Created new component template: ${newComponent.name}`);
}

/**
 * Demo 3: XState Visualizer Integration
 */
async function demoXStateVisualizerIntegration(genericEditor) {
  console.log('\n📊 Demo 3: XState Visualizer Integration');
  
  // Get state machines
  const stateMachines = genericEditor.getAllStateMachines();
  
  for (const stateMachine of stateMachines) {
    console.log(`  📊 Visualizing state machine: ${stateMachine.name}`);
    
    // Create visualization
    const visualization = await genericEditor.xstateVisualizer.visualize(stateMachine.config);
    
    console.log(`    - States: ${visualization.states.length}`);
    console.log(`    - Transitions: ${visualization.transitions.length}`);
    
    // Show transitions
    visualization.transitions.forEach(transition => {
      console.log(`      ${transition.from} --${transition.event}--> ${transition.to}`);
    });
    
    // Export SVG
    const svg = await genericEditor.xstateVisualizer.exportSVG(stateMachine.config);
    console.log(`    - SVG exported: ${svg.length} characters`);
  }
  
  // Create complex state machine for visualization
  const complexStateMachine = {
    id: 'complex-workflow',
    name: 'Complex Workflow',
    config: {
      id: 'complex',
      initial: 'start',
      states: {
        start: {
          on: { NEXT: 'processing' }
        },
        processing: {
          on: { SUCCESS: 'success', ERROR: 'error', RETRY: 'processing' }
        },
        success: {
          on: { CONTINUE: 'final' }
        },
        error: {
          on: { RETRY: 'processing', ABORT: 'final' }
        },
        final: {
          type: 'final'
        }
      }
    }
  };
  
  const complexVisualization = await genericEditor.xstateVisualizer.visualize(complexStateMachine.config);
  console.log(`  📊 Complex workflow visualization:`);
  console.log(`    - States: ${complexVisualization.states.length}`);
  console.log(`    - Transitions: ${complexVisualization.transitions.length}`);
}

/**
 * Demo 4: SunEditor Integration
 */
async function demoSunEditorIntegration(genericEditor) {
  console.log('\n📝 Demo 4: SunEditor Integration');
  
  // Create HTML editor
  const htmlEditor = await genericEditor.sunEditor.createEditor('html-editor', `
    <div class="checkout-form">
      <h2>Complete Your Order</h2>
      <form>
        <input type="email" placeholder="Enter your email" />
        <button type="submit">Submit Order</button>
      </form>
    </div>
  `);
  
  console.log(`  📝 Created HTML editor with ${htmlEditor.getContents().length} characters`);
  
  // Create CSS editor
  const cssEditor = await genericEditor.sunEditor.createEditor('css-editor', `
    .checkout-form {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    
    .checkout-form h2 {
      color: #333;
      margin-bottom: 20px;
    }
    
    .checkout-form input {
      width: 100%;
      padding: 10px;
      margin-bottom: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .checkout-form button {
      background: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `);
  
  console.log(`  📝 Created CSS editor with ${cssEditor.getContents().length} characters`);
  
  // Create data attribute plugin
  const dataAttributePlugin = await genericEditor.sunEditor.createDataAttributePlugin();
  htmlEditor.addPlugin(dataAttributePlugin);
  console.log(`  🔌 Added data attribute plugin to HTML editor`);
  
  // Update content
  htmlEditor.setContents(`
    <div class="checkout-form" data-component="checkout-form">
      <h2 data-field="title">Complete Your Order</h2>
      <form data-form-id="checkout-form">
        <input type="email" placeholder="Enter your email" data-field="email" />
        <button type="submit" data-action="submit">Submit Order</button>
      </form>
    </div>
  `);
  
  console.log(`  📝 Updated HTML content with data attributes`);
}

/**
 * Demo 5: Ace Editor Integration
 */
async function demoAceEditorIntegration(genericEditor) {
  console.log('\n💻 Demo 5: Ace Editor Integration');
  
  // Create JSON editor for component variables
  const jsonEditor = await genericEditor.aceEditor.createEditor('json-editor', JSON.stringify({
    title: 'Complete Your Order',
    formId: 'checkout-form',
    emailPlaceholder: 'Enter your email',
    submitText: 'Submit Order'
  }, null, 2));
  
  console.log(`  💻 Created JSON editor with ${jsonEditor.getValue().length} characters`);
  
  // Create XState configuration editor
  const xstateConfig = {
    id: 'checkout',
    initial: 'idle',
    states: {
      idle: {
        on: { START: 'loading' }
      },
      loading: {
        on: { SUCCESS: 'success', ERROR: 'error' }
      },
      success: {
        type: 'final'
      },
      error: {
        on: { RETRY: 'loading' }
      }
    }
  };
  
  const configEditor = await genericEditor.aceEditor.createEditor('config-editor', JSON.stringify(xstateConfig, null, 2));
  configEditor.setMode('json');
  
  console.log(`  💻 Created XState config editor with ${configEditor.getValue().length} characters`);
  
  // Create state editor
  const stateEditor = await genericEditor.aceEditor.createEditor('state-editor', JSON.stringify({
    formData: {},
    validationErrors: [],
    isSubmitting: false
  }, null, 2));
  
  console.log(`  💻 Created state editor with ${stateEditor.getValue().length} characters`);
  
  // Update content
  const updatedConfig = {
    ...xstateConfig,
    states: {
      ...xstateConfig.states,
      processing: {
        on: { COMPLETE: 'success', FAIL: 'error' }
      }
    }
  };
  
  configEditor.setValue(JSON.stringify(updatedConfig, null, 2));
  console.log(`  💻 Updated XState configuration`);
}

/**
 * Demo 6: React DnD Workflow Creation
 */
async function demoReactDnDWorkflowCreation(genericEditor) {
  console.log('\n🎯 Demo 6: React DnD Workflow Creation');
  
  // Create workflow editor
  const workflowEditor = await genericEditor.createWorkflowEditor();
  
  // Add components and state machines to drag-drop context
  const components = genericEditor.getAllComponents();
  const stateMachines = genericEditor.getAllStateMachines();
  
  console.log(`  🎯 Added ${components.length} components to workflow editor`);
  console.log(`  🎯 Added ${stateMachines.length} state machines to workflow editor`);
  
  // Simulate drag and drop workflow creation
  const workflowItems = [
    {
      id: 'checkout-form',
      type: 'component',
      name: 'Checkout Form',
      position: { x: 100, y: 100 }
    },
    {
      id: 'checkout-state-machine',
      type: 'stateMachine',
      name: 'Checkout State Machine',
      position: { x: 300, y: 100 }
    },
    {
      id: 'payment-form',
      type: 'component',
      name: 'Payment Form',
      position: { x: 100, y: 300 }
    },
    {
      id: 'payment-state-machine',
      type: 'stateMachine',
      name: 'Payment State Machine',
      position: { x: 300, y: 300 }
    }
  ];
  
  // Add items to drag-drop context
  workflowItems.forEach(item => {
    workflowEditor.dragDropContext.addItem(item);
    console.log(`  🎯 Added item to workflow: ${item.name} at (${item.position.x}, ${item.position.y})`);
  });
  
  // Create workflow
  const workflow = await workflowEditor.createWorkflow(workflowItems);
  console.log(`  ✅ Created workflow: ${workflow.id}`);
  console.log(`    - Items: ${workflow.items.length}`);
  console.log(`    - Connections: ${workflow.connections.length}`);
  
  // Simulate drop callback
  workflowEditor.dragDropContext.onDrop((item, target) => {
    console.log(`  🎯 Item dropped: ${item.name} -> ${target.name}`);
  });
}

/**
 * Demo 7: Versioning and Review Workflow
 */
async function demoVersioningAndReviewWorkflow(genericEditor) {
  console.log('\n📦 Demo 7: Versioning and Review Workflow');
  
  // Get components for versioning
  const components = genericEditor.getAllComponents();
  
  for (const component of components) {
    console.log(`  📦 Managing versioning for: ${component.name}`);
    
    // Create new version
    const newVersion = {
      ...component,
      semanticVersion: '1.1.0',
      status: 'draft',
      updatedAt: new Date().toISOString()
    };
    
    console.log(`    - Created version ${newVersion.semanticVersion}`);
    
    // Update status through workflow
    const statusWorkflow = [
      { status: 'draft', user: 'designer', timestamp: new Date().toISOString() },
      { status: 'review', user: 'reviewer', timestamp: new Date().toISOString() },
      { status: 'published', user: 'publisher', timestamp: new Date().toISOString() }
    ];
    
    for (const step of statusWorkflow) {
      newVersion.updateStatus(step.status, step.user);
      console.log(`    - Status updated to ${step.status} by ${step.user}`);
    }
    
    // Save to dotCMS
    await genericEditor.dotCMS.saveComponent(newVersion);
    console.log(`    - Saved to dotCMS`);
  }
  
  // Create review workflow
  const reviewWorkflow = {
    id: 'review-workflow-1',
    steps: [
      { name: 'design', role: 'designer', required: true },
      { name: 'development', role: 'developer', required: true },
      { name: 'review', role: 'reviewer', required: true },
      { name: 'approval', role: 'approver', required: true },
      { name: 'publish', role: 'publisher', required: true }
    ],
    currentStep: 'design',
    status: 'in-progress'
  };
  
  console.log(`  📋 Created review workflow: ${reviewWorkflow.id}`);
  console.log(`    - Steps: ${reviewWorkflow.steps.length}`);
  console.log(`    - Current step: ${reviewWorkflow.currentStep}`);
  console.log(`    - Status: ${reviewWorkflow.status}`);
}

/**
 * Demo 8: Integration with Fish Burger
 */
async function demoFishBurgerIntegration(genericEditor) {
  console.log('\n🍔 Demo 8: Fish Burger Integration');
  
  // Create fish burger specific components
  const fishBurgerComponents = [
    {
      id: 'fish-burger-order-form',
      name: 'Fish Burger Order Form',
      semanticVersion: '1.0.0',
      template: `
        <div class="fish-burger-order" data-component="fish-burger-order">
          <h2>{{title}}</h2>
          <div class="menu-items">
            <div class="menu-item" data-item="fish-burger">
              <h3>{{fishBurgerName}}</h3>
              <p>{{fishBurgerDescription}}</p>
              <span class="price">{{fishBurgerPrice}}</span>
              <button data-action="add-to-cart" data-item="fish-burger">Add to Cart</button>
            </div>
            <div class="menu-item" data-item="french-fries">
              <h3>{{friesName}}</h3>
              <p>{{friesDescription}}</p>
              <span class="price">{{friesPrice}}</span>
              <button data-action="add-to-cart" data-item="french-fries">Add to Cart</button>
            </div>
          </div>
          <div class="cart-summary">
            <h3>{{cartTitle}}</h3>
            <div class="cart-items" data-field="cartItems"></div>
            <div class="total" data-field="total">Total: {{totalAmount}}</div>
            <button data-action="checkout">{{checkoutText}}</button>
          </div>
        </div>
      `,
      variables: {
        title: 'Fish Burger Menu',
        fishBurgerName: 'Fish Burger',
        fishBurgerDescription: 'Fresh fish with crispy coating',
        fishBurgerPrice: '$12.99',
        friesName: 'French Fries',
        friesDescription: 'Crispy golden fries',
        friesPrice: '$4.99',
        cartTitle: 'Your Order',
        totalAmount: '$0.00',
        checkoutText: 'Checkout'
      },
      defaultData: {
        cartItems: [],
        total: 0,
        isCheckingOut: false
      },
      compatibleStateMachines: ['fish-burger-order-state-machine'],
      status: 'published'
    }
  ];
  
  // Create fish burger state machine
  const fishBurgerStateMachine = {
    id: 'fish-burger-order-state-machine',
    name: 'Fish Burger Order State Machine',
    config: {
      id: 'fishBurgerOrder',
      initial: 'browsing',
      states: {
        browsing: {
          on: { ADD_TO_CART: 'cart' }
        },
        cart: {
          on: { CHECKOUT: 'checkout', CONTINUE_SHOPPING: 'browsing' }
        },
        checkout: {
          on: { PAYMENT_SUCCESS: 'success', PAYMENT_FAILED: 'error' }
        },
        success: {
          type: 'final'
        },
        error: {
          on: { RETRY: 'checkout', CANCEL: 'browsing' }
        }
      }
    },
    initialState: {
      cartItems: [],
      total: 0,
      isCheckingOut: false
    },
    status: 'published'
  };
  
  // Add components to editor
  const { DotCMSComponentTemplate, XStateConfiguration } = await import('./index.js');
  
  fishBurgerComponents.forEach(componentData => {
    const component = new DotCMSComponentTemplate(componentData);
    genericEditor.components.set(component.id, component);
    console.log(`  🍔 Added fish burger component: ${component.name}`);
  });
  
  // Add state machine to editor
  const stateMachine = new XStateConfiguration(fishBurgerStateMachine);
  genericEditor.stateMachines.set(stateMachine.id, stateMachine);
  console.log(`  🍔 Added fish burger state machine: ${stateMachine.name}`);
  
  // Create ViewStateMachine
  const fishBurgerViewStateMachine = genericEditor.createViewStateMachine(
    'fish-burger-order-form',
    'fish-burger-order-state-machine',
    {
      cartItems: [
        { id: 'fish-burger', name: 'Fish Burger', price: 12.99, quantity: 1 },
        { id: 'french-fries', name: 'French Fries', price: 4.99, quantity: 1 }
      ],
      total: 17.98,
      isCheckingOut: false
    }
  );
  
  console.log(`  🍔 Created fish burger ViewStateMachine: ${fishBurgerViewStateMachine.machineId}`);
  
  // Create workflow
  const fishBurgerWorkflow = await genericEditor.createWorkflowEditor();
  const workflow = await fishBurgerWorkflow.createWorkflow([
    { id: 'fish-burger-order-form', type: 'component' },
    { id: 'fish-burger-order-state-machine', type: 'stateMachine' }
  ]);
  
  console.log(`  🍔 Created fish burger workflow: ${workflow.id}`);
}

/**
 * Integration with Fish Burger Backend
 */
export async function integrateWithFishBurger(genericEditor) {
  console.log('\n🍔 Integrating with Fish Burger Backend...');
  
  // Create fish burger ViewStateMachine
  const fishBurgerViewStateMachine = genericEditor.createViewStateMachine(
    'fish-burger-order-form',
    'fish-burger-order-state-machine',
    {
      cartItems: [],
      total: 0,
      isCheckingOut: false
    }
  );
  
  console.log(`  🔗 Created fish burger ViewStateMachine: ${fishBurgerViewStateMachine.machineId}`);
  
  return {
    viewStateMachine: fishBurgerViewStateMachine,
    components: genericEditor.getAllComponents(),
    stateMachines: genericEditor.getAllStateMachines()
  };
} 