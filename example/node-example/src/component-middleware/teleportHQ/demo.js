/**
 * TeleportHQ Integration Demo
 * 
 * This demo showcases the complete TeleportHQ integration including:
 * - Template loading and caching
 * - ViewStateMachine creation
 * - Template connections and state synchronization
 * - Real-time collaboration features
 * - Template versioning and publishing
 * - Advanced state management with validation
 */

import { createTeleportHQAdapter } from './index.js';

/**
 * Enhanced TeleportHQ Demo with Advanced Features
 */
export async function runTeleportHQDemo() {
  console.log('🚀 Starting Enhanced TeleportHQ Demo...');
  
  const componentMiddleware = createTeleportHQAdapter({
    teleportHQ: {
      apiKey: process.env.TELEPORTHQ_API_KEY || 'demo-key',
      projectId: process.env.TELEPORTHQ_PROJECT_ID || 'demo-project',
      environment: process.env.NODE_ENV || 'development',
      enableRealTimeSync: true,
      enableComponentStateSync: true,
      enableCollaboration: true,
      enableVersioning: true,
      enabled: true
    }
  });

  try {
    // Initialize middleware
    await componentMiddleware.initialize();
    console.log('✅ Component middleware initialized');

    // Demo 1: Basic Template Management
    await demoBasicTemplateManagement(componentMiddleware);
    
    // Demo 2: Advanced State Management
    await demoAdvancedStateManagement(componentMiddleware);
    
    // Demo 3: Template Connections and Workflows
    await demoTemplateConnections(componentMiddleware);
    
    // Demo 4: Real-time Collaboration
    await demoRealTimeCollaboration(componentMiddleware);
    
    // Demo 5: Template Versioning and Publishing
    await demoVersioningAndPublishing(componentMiddleware);
    
    // Demo 6: Integration with Fish Burger
    await demoFishBurgerIntegration(componentMiddleware);
    
    // Demo 7: Performance and Caching
    await demoPerformanceAndCaching(componentMiddleware);
    
    // Demo 8: Advanced Validation and Error Handling
    await demoValidationAndErrorHandling(componentMiddleware);

    console.log('🎉 Enhanced TeleportHQ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ TeleportHQ Demo failed:', error);
    throw error;
  }
}

/**
 * Demo 1: Basic Template Management
 */
async function demoBasicTemplateManagement(componentMiddleware) {
  console.log('\n📁 Demo 1: Basic Template Management');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Load multiple templates
  const templates = [
    'checkout-form',
    'payment-form', 
    'order-summary',
    'user-profile',
    'product-catalog'
  ];
  
  for (const templateId of templates) {
    console.log(`  Loading template: ${templateId}`);
    await teleportHQ.loadTemplate(templateId, {
      enableRealTimeSync: true,
      enableValidation: true
    });
  }
  
  // Create ViewStateMachines from templates
  const checkoutMachine = teleportHQ.createViewStateMachine('checkout-form', {
    formData: {
      email: '',
      items: [],
      total: 0
    },
    validationErrors: [],
    isSubmitting: false
  });
  
  console.log(`  ✅ Created ViewStateMachine: ${checkoutMachine.machineId}`);
  
  // Update template state
  const updatedState = teleportHQ.updateTemplateState('checkout-form', {
    formData: {
      email: 'user@example.com',
      items: ['Fish Burger', 'French Fries'],
      total: 17.98
    },
    validationErrors: [],
    isSubmitting: false
  });
  
  console.log(`  ✅ Updated state for checkout-form`);
}

/**
 * Demo 2: Advanced State Management
 */
async function demoAdvancedStateManagement(componentMiddleware) {
  console.log('\n🔄 Demo 2: Advanced State Management');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Create complex state with nested objects
  const complexState = {
    user: {
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      },
      cart: {
        items: [
          { id: 1, name: 'Fish Burger', price: 12.99, quantity: 2 },
          { id: 2, name: 'French Fries', price: 4.99, quantity: 1 }
        ],
        total: 30.97,
        discount: 0.10
      }
    },
    ui: {
      currentStep: 'checkout',
      loading: false,
      errors: []
    }
  };
  
  // Update state with deep merging
  teleportHQ.updateTemplateState('user-profile', complexState);
  
  // Create state watchers
  teleportHQ.watchTemplateState('user-profile', (oldState, newState) => {
    console.log('  📊 State changed:', {
      oldTotal: oldState?.user?.cart?.total,
      newTotal: newState?.user?.cart?.total
    });
  });
  
  // Batch state updates
  const batchUpdates = [
    { templateId: 'checkout-form', updates: { isSubmitting: true } },
    { templateId: 'payment-form', updates: { processing: true } },
    { templateId: 'order-summary', updates: { calculating: true } }
  ];
  
  teleportHQ.batchUpdateStates(batchUpdates);
  console.log('  ✅ Applied batch state updates');
}

/**
 * Demo 3: Template Connections and Workflows
 */
async function demoTemplateConnections(componentMiddleware) {
  console.log('\n🔗 Demo 3: Template Connections and Workflows');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Create complex workflow connections
  const connections = [
    {
      sourceTemplateId: 'checkout-form',
      targetTemplateId: 'payment-form',
      config: {
        eventMapping: {
          'SUBMIT_ORDER': 'PROCESS_PAYMENT',
          'EMAIL_CHANGED': 'UPDATE_CUSTOMER_EMAIL'
        },
        stateMapping: {
          'formData.email': 'customerEmail',
          'formData.total': 'paymentAmount'
        },
        bidirectional: true
      }
    },
    {
      sourceTemplateId: 'payment-form',
      targetTemplateId: 'order-summary',
      config: {
        eventMapping: {
          'PAYMENT_SUCCESS': 'SHOW_CONFIRMATION',
          'PAYMENT_FAILED': 'SHOW_ERROR'
        },
        stateMapping: {
          'paymentResult': 'orderStatus',
          'transactionId': 'orderId'
        }
      }
    },
    {
      sourceTemplateId: 'user-profile',
      targetTemplateId: 'checkout-form',
      config: {
        eventMapping: {
          'PROFILE_UPDATED': 'AUTO_FILL_FORM'
        },
        stateMapping: {
          'profile.email': 'formData.email',
          'profile.name': 'formData.name'
        }
      }
    }
  ];
  
  for (const connection of connections) {
    const connectionId = teleportHQ.connectTemplates(
      connection.sourceTemplateId,
      connection.targetTemplateId,
      connection.config
    );
    console.log(`  ✅ Connected ${connection.sourceTemplateId} -> ${connection.targetTemplateId}`);
  }
  
  // Create workflow orchestration
  const workflow = teleportHQ.createWorkflow('checkout-workflow', {
    steps: [
      { templateId: 'checkout-form', step: 1, required: true },
      { templateId: 'payment-form', step: 2, required: true },
      { templateId: 'order-summary', step: 3, required: true }
    ],
    validation: {
      requireEmail: true,
      requirePayment: true,
      minOrderValue: 5.00
    }
  });
  
  console.log(`  ✅ Created workflow: ${workflow.id}`);
}

/**
 * Demo 4: Real-time Collaboration
 */
async function demoRealTimeCollaboration(componentMiddleware) {
  console.log('\n👥 Demo 4: Real-time Collaboration');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Simulate multiple users collaborating
  const users = [
    { id: 'user1', name: 'Alice', role: 'designer' },
    { id: 'user2', name: 'Bob', role: 'developer' },
    { id: 'user3', name: 'Charlie', role: 'reviewer' }
  ];
  
  // Enable collaboration features
  teleportHQ.enableCollaboration('checkout-form', {
    users,
    permissions: {
      designer: ['view', 'edit', 'comment'],
      developer: ['view', 'edit', 'publish'],
      reviewer: ['view', 'comment', 'approve']
    },
    realTimeSync: true
  });
  
  // Simulate collaborative editing
  for (const user of users) {
    teleportHQ.updateTemplateState('checkout-form', {
      lastEditedBy: user.id,
      lastEditedAt: new Date().toISOString(),
      ui: {
        currentStep: 'checkout',
        loading: false,
        errors: []
      }
    }, { userId: user.id });
    
    console.log(`  👤 ${user.name} updated checkout-form`);
  }
  
  // Get collaboration history
  const history = teleportHQ.getCollaborationHistory('checkout-form');
  console.log(`  📜 Collaboration history: ${history.length} entries`);
}

/**
 * Demo 5: Template Versioning and Publishing
 */
async function demoVersioningAndPublishing(componentMiddleware) {
  console.log('\n📦 Demo 5: Template Versioning and Publishing');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Create template versions
  const versions = [
    { version: '1.0.0', status: 'draft', changes: 'Initial version' },
    { version: '1.1.0', status: 'review', changes: 'Added payment integration' },
    { version: '1.2.0', status: 'published', changes: 'Enhanced validation' }
  ];
  
  for (const versionInfo of versions) {
    const version = teleportHQ.createTemplateVersion('checkout-form', {
      version: versionInfo.version,
      status: versionInfo.status,
      changes: versionInfo.changes,
      author: 'demo-user',
      timestamp: new Date().toISOString()
    });
    
    console.log(`  📋 Created version ${version.version} (${version.status})`);
  }
  
  // Publish template
  const published = teleportHQ.publishTemplate('checkout-form', {
    version: '1.2.0',
    environment: 'production',
    notes: 'Production ready checkout form'
  });
  
  console.log(`  ✅ Published template: ${published.id}`);
  
  // Create release notes
  const releaseNotes = teleportHQ.createReleaseNotes('checkout-form', {
    version: '1.2.0',
    features: [
      'Enhanced form validation',
      'Improved payment flow',
      'Better error handling'
    ],
    breakingChanges: [],
    deprecations: []
  });
  
  console.log(`  📝 Created release notes for version ${releaseNotes.version}`);
}

/**
 * Demo 6: Integration with Fish Burger
 */
async function demoFishBurgerIntegration(componentMiddleware) {
  console.log('\n🍔 Demo 6: Fish Burger Integration');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Load fish burger specific templates
  const fishBurgerTemplates = [
    'fish-burger-order-form',
    'fish-burger-payment',
    'fish-burger-kitchen-display',
    'fish-burger-delivery-tracking'
  ];
  
  for (const templateId of fishBurgerTemplates) {
    await teleportHQ.loadTemplate(templateId);
    console.log(`  🍔 Loaded ${templateId}`);
  }
  
  // Create fish burger workflow
  const fishBurgerWorkflow = teleportHQ.createWorkflow('fish-burger-workflow', {
    steps: [
      { templateId: 'fish-burger-order-form', step: 1, required: true },
      { templateId: 'fish-burger-payment', step: 2, required: true },
      { templateId: 'fish-burger-kitchen-display', step: 3, required: false },
      { templateId: 'fish-burger-delivery-tracking', step: 4, required: false }
    ],
    businessRules: {
      minOrderValue: 5.00,
      maxDeliveryDistance: 10,
      kitchenCapacity: 20
    }
  });
  
  console.log(`  🍔 Created fish burger workflow: ${fishBurgerWorkflow.id}`);
  
  // Connect with existing fish burger backend
  const integration = teleportHQ.integrateWithBackend('fish-burger-backend', {
    endpoints: {
      orders: '/api/orders',
      payments: '/api/payments',
      kitchen: '/api/kitchen',
      delivery: '/api/delivery'
    },
    authentication: {
      type: 'api-key',
      key: process.env.FISH_BURGER_API_KEY
    }
  });
  
  console.log(`  🔗 Integrated with fish burger backend`);
}

/**
 * Demo 7: Performance and Caching
 */
async function demoPerformanceAndCaching(componentMiddleware) {
  console.log('\n⚡ Demo 7: Performance and Caching');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Get cache statistics
  const cacheStats = teleportHQ.getCacheStats();
  console.log(`  📊 Cache stats:`, cacheStats);
  
  // Performance monitoring
  const performance = teleportHQ.getPerformanceMetrics();
  console.log(`  ⚡ Performance metrics:`, {
    avgLoadTime: performance.avgLoadTime,
    cacheHitRate: performance.cacheHitRate,
    memoryUsage: performance.memoryUsage
  });
  
  // Optimize cache
  teleportHQ.optimizeCache({
    maxSize: 100,
    ttl: 300000, // 5 minutes
    strategy: 'lru'
  });
  
  console.log(`  🔧 Cache optimized`);
  
  // Preload frequently used templates
  const frequentlyUsed = ['checkout-form', 'payment-form', 'user-profile'];
  await teleportHQ.preloadTemplates(frequentlyUsed);
  console.log(`  📥 Preloaded ${frequentlyUsed.length} templates`);
}

/**
 * Demo 8: Advanced Validation and Error Handling
 */
async function demoValidationAndErrorHandling(componentMiddleware) {
  console.log('\n✅ Demo 8: Advanced Validation and Error Handling');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Validate template structure
  const validation = teleportHQ.validateTemplate('checkout-form', {
    requiredComponents: ['form', 'button', 'input'],
    requiredStates: ['idle', 'submitting', 'success', 'error'],
    requiredEvents: ['SUBMIT', 'RESET', 'VALIDATE']
  });
  
  console.log(`  ✅ Template validation:`, validation);
  
  // Test error scenarios
  try {
    await teleportHQ.loadTemplate('non-existent-template');
  } catch (error) {
    console.log(`  ❌ Expected error caught: ${error.message}`);
  }
  
  // Test state validation
  const invalidState = {
    formData: {
      email: 'invalid-email',
      total: -10 // Invalid negative total
    }
  };
  
  const stateValidation = teleportHQ.validateTemplateState('checkout-form', invalidState);
  console.log(`  ⚠️ State validation errors:`, stateValidation.errors);
  
  // Test connection validation
  const invalidConnection = {
    sourceTemplateId: 'checkout-form',
    targetTemplateId: 'non-existent-template',
    config: {
      eventMapping: {
        'INVALID_EVENT': 'TARGET_EVENT'
      }
    }
  };
  
  try {
    teleportHQ.connectTemplates(
      invalidConnection.sourceTemplateId,
      invalidConnection.targetTemplateId,
      invalidConnection.config
    );
  } catch (error) {
    console.log(`  ❌ Connection validation error: ${error.message}`);
  }
}

/**
 * Integration with Fish Burger Backend
 */
export async function integrateWithFishBurger(componentMiddleware) {
  console.log('\n🍔 Integrating with Fish Burger Backend...');
  
  const teleportHQ = componentMiddleware.getTeleportHQ();
  
  // Create fish burger specific ViewStateMachine
  const fishBurgerMachine = teleportHQ.createViewStateMachine('fish-burger-order', {
    order: {
      items: [],
      total: 0,
      status: 'pending'
    },
    customer: {
      name: '',
      email: '',
      address: ''
    },
    payment: {
      method: '',
      status: 'pending'
    }
  });
  
  // Connect with existing fish burger state machine
  const connection = teleportHQ.connectTemplates('fish-burger-order', 'fish-burger-backend', {
    eventMapping: {
      'SUBMIT_ORDER': 'START_COOKING',
      'PAYMENT_SUCCESS': 'PROCESS_ORDER',
      'KITCHEN_READY': 'DELIVER_ORDER'
    },
    stateMapping: {
      'order.items': 'kitchen.items',
      'order.total': 'payment.amount',
      'customer.address': 'delivery.address'
    }
  });
  
  console.log(`  🔗 Connected fish burger order with backend`);
  
  return {
    machine: fishBurgerMachine,
    connection: connection
  };
} 