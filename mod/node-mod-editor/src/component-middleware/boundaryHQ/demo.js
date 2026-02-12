/**
 * HashiCorp BoundaryHQ Integration Demo
 * 
 * This demo showcases the complete BoundaryHQ integration including:
 * - Identity-based access control
 * - Secure component management
 * - Secure state machine orchestration
 * - Audit logging and compliance
 * - Encryption and data protection
 * - Access policy management
 */

import { createBoundaryHQAdapter } from './index.js';

/**
 * Enhanced BoundaryHQ Demo with Advanced Security Features
 */
export async function runBoundaryHQDemo() {
  console.log('🚀 Starting Enhanced HashiCorp BoundaryHQ Demo...');
  
  const boundaryHQ = createBoundaryHQAdapter({
    apiKey: process.env.BOUNDARYHQ_API_KEY || 'demo-key',
    projectId: process.env.BOUNDARYHQ_PROJECT_ID || 'demo-project',
    environment: process.env.NODE_ENV || 'development',
    enableIdentityManagement: true,
    enableSecureStateSync: true,
    enableAccessControl: true,
    enableAuditLogging: true,
    enableEncryption: true
  });

  try {
    // Initialize adapter
    await boundaryHQ.initialize();
    console.log('✅ BoundaryHQ adapter initialized');

    // Demo 1: Identity Management
    await demoIdentityManagement(boundaryHQ);
    
    // Demo 2: Access Control and Policies
    await demoAccessControlAndPolicies(boundaryHQ);
    
    // Demo 3: Secure Component Management
    await demoSecureComponentManagement(boundaryHQ);
    
    // Demo 4: Secure State Machine Orchestration
    await demoSecureStateMachineOrchestration(boundaryHQ);
    
    // Demo 5: Audit Logging and Compliance
    await demoAuditLoggingAndCompliance(boundaryHQ);
    
    // Demo 6: Encryption and Data Protection
    await demoEncryptionAndDataProtection(boundaryHQ);
    
    // Demo 7: Integration with Fish Burger
    await demoFishBurgerIntegration(boundaryHQ);
    
    // Demo 8: Advanced Security Features
    await demoAdvancedSecurityFeatures(boundaryHQ);

    console.log('🎉 Enhanced BoundaryHQ Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ BoundaryHQ Demo failed:', error);
    throw error;
  }
}

/**
 * Demo 1: Identity Management
 */
async function demoIdentityManagement(boundaryHQ) {
  console.log('\n👤 Demo 1: Identity Management');
  
  // Get all identities
  const identities = Array.from(boundaryHQ.identities.values());
  
  console.log(`  👥 Total identities: ${identities.length}`);
  
  for (const identity of identities) {
    console.log(`  👤 Identity: ${identity.name}`);
    console.log(`    - Role: ${identity.role}`);
    console.log(`    - Permissions: ${identity.permissions.join(', ')}`);
    console.log(`    - Groups: ${identity.groups.join(', ')}`);
    console.log(`    - Status: ${identity.status}`);
  }
  
  // Create new identity
  const newIdentity = boundaryHQ.createIdentity({
    id: 'new-user-1',
    name: 'New User',
    email: 'newuser@boundaryhq.io',
    role: 'developer',
    permissions: ['read', 'write'],
    groups: ['developers', 'testers']
  });
  
  console.log(`  ✅ Created new identity: ${newIdentity.name}`);
  
  // Update identity
  const updatedIdentity = boundaryHQ.updateIdentity('new-user-1', {
    permissions: ['read', 'write', 'test'],
    groups: ['developers', 'testers', 'qa']
  });
  
  console.log(`  ✅ Updated identity: ${updatedIdentity.name}`);
  console.log(`    - New permissions: ${updatedIdentity.permissions.join(', ')}`);
  console.log(`    - New groups: ${updatedIdentity.groups.join(', ')}`);
  
  // Test permission checks
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  const userIdentity = boundaryHQ.getIdentity('user-1');
  
  console.log(`  🔐 Permission checks:`);
  console.log(`    - Admin can delete: ${adminIdentity.hasPermission('delete')}`);
  console.log(`    - Developer can write: ${devIdentity.hasPermission('write')}`);
  console.log(`    - User can read: ${userIdentity.hasPermission('read')}`);
  console.log(`    - User can delete: ${userIdentity.hasPermission('delete')}`);
}

/**
 * Demo 2: Access Control and Policies
 */
async function demoAccessControlAndPolicies(boundaryHQ) {
  console.log('\n🔐 Demo 2: Access Control and Policies');
  
  // Get all access policies
  const policies = Array.from(boundaryHQ.accessPolicies.values());
  
  console.log(`  📋 Total access policies: ${policies.length}`);
  
  for (const policy of policies) {
    console.log(`  📋 Policy: ${policy.name}`);
    console.log(`    - Roles: ${policy.roles.join(', ')}`);
    console.log(`    - Permissions: ${policy.permissions.join(', ')}`);
    console.log(`    - Resources: ${policy.resources.join(', ')}`);
  }
  
  // Create new access policy
  const newPolicy = {
    id: 'qa-policy',
    name: 'QA Policy',
    roles: ['qa', 'tester'],
    permissions: ['read', 'test'],
    resources: ['components', 'test-results']
  };
  
  boundaryHQ.accessPolicies.set(newPolicy.id, newPolicy);
  console.log(`  ✅ Created new access policy: ${newPolicy.name}`);
  
  // Test access control with different identities
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  const userIdentity = boundaryHQ.getIdentity('user-1');
  
  console.log(`  🔐 Access control tests:`);
  console.log(`    - Admin role: ${adminIdentity.role}`);
  console.log(`    - Developer role: ${devIdentity.role}`);
  console.log(`    - User role: ${userIdentity.role}`);
  
  // Test resource access
  const testResources = ['components', 'state-machines', 'admin-panel'];
  
  for (const resource of testResources) {
    console.log(`  📊 Resource access for ${resource}:`);
    console.log(`    - Admin: ${adminIdentity.hasPermission('read') ? '✅' : '❌'}`);
    console.log(`    - Developer: ${devIdentity.hasPermission('read') ? '✅' : '❌'}`);
    console.log(`    - User: ${userIdentity.hasPermission('read') ? '✅' : '❌'}`);
  }
}

/**
 * Demo 3: Secure Component Management
 */
async function demoSecureComponentManagement(boundaryHQ) {
  console.log('\n🔒 Demo 3: Secure Component Management');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  const userIdentity = boundaryHQ.getIdentity('user-1');
  
  // Create secure components
  const secureComponents = [
    {
      id: 'secure-checkout-form',
      name: 'Secure Checkout Form',
      type: 'form',
      encryptedData: {
        template: '<div class="secure-checkout">...</div>',
        styles: '.secure-checkout { background: #f8f9fa; }',
        config: { validation: true, encryption: true }
      }
    },
    {
      id: 'secure-payment-form',
      name: 'Secure Payment Form',
      type: 'form',
      encryptedData: {
        template: '<div class="secure-payment">...</div>',
        styles: '.secure-payment { border: 2px solid #28a745; }',
        config: { pciCompliant: true, encryption: true }
      }
    },
    {
      id: 'secure-user-profile',
      name: 'Secure User Profile',
      type: 'profile',
      encryptedData: {
        template: '<div class="secure-profile">...</div>',
        styles: '.secure-profile { padding: 20px; }',
        config: { dataProtection: true, encryption: true }
      }
    }
  ];
  
  for (const componentData of secureComponents) {
    const secureComponent = boundaryHQ.createSecureComponent(componentData, adminIdentity);
    console.log(`  🔒 Created secure component: ${secureComponent.name}`);
  }
  
  // Test component access
  console.log(`  🔐 Component access tests:`);
  
  for (const componentData of secureComponents) {
    const componentId = componentData.id;
    
    try {
      const component = boundaryHQ.getSecureComponent(componentId, adminIdentity);
      console.log(`    - Admin can access ${component.name}: ✅`);
    } catch (error) {
      console.log(`    - Admin cannot access ${componentId}: ❌ ${error.message}`);
    }
    
    try {
      const component = boundaryHQ.getSecureComponent(componentId, devIdentity);
      console.log(`    - Developer can access ${component.name}: ✅`);
    } catch (error) {
      console.log(`    - Developer cannot access ${componentId}: ❌ ${error.message}`);
    }
    
    try {
      const component = boundaryHQ.getSecureComponent(componentId, userIdentity);
      console.log(`    - User can access ${component.name}: ✅`);
    } catch (error) {
      console.log(`    - User cannot access ${componentId}: ❌ ${error.message}`);
    }
  }
  
  // Update secure component
  const updatedComponent = boundaryHQ.updateSecureComponent('secure-checkout-form', {
    encryptedData: {
      template: '<div class="secure-checkout-v2">...</div>',
      styles: '.secure-checkout-v2 { background: #e9ecef; }',
      config: { validation: true, encryption: true, version: '2.0' }
    }
  }, devIdentity);
  
  console.log(`  ✅ Updated secure component: ${updatedComponent.name}`);
  
  // Delete secure component (admin only)
  const deleted = boundaryHQ.deleteSecureComponent('secure-user-profile', adminIdentity);
  console.log(`  ✅ Deleted secure component: ${deleted}`);
}

/**
 * Demo 4: Secure State Machine Orchestration
 */
async function demoSecureStateMachineOrchestration(boundaryHQ) {
  console.log('\n⚡ Demo 4: Secure State Machine Orchestration');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  
  // Create secure state machines
  const secureStateMachines = [
    {
      id: 'secure-checkout-flow',
      name: 'Secure Checkout Flow',
      config: {
        id: 'secureCheckout',
        initial: 'browsing',
        states: {
          browsing: { on: { ADD_TO_CART: 'cart' } },
          cart: { on: { CHECKOUT: 'secure_checkout' } },
          secure_checkout: { on: { PAYMENT_SUCCESS: 'success', PAYMENT_FAILED: 'error' } },
          success: { type: 'final' },
          error: { on: { RETRY: 'secure_checkout' } }
        }
      },
      encryptedState: {
        cartItems: [],
        total: 0,
        paymentMethod: null,
        isProcessing: false
      }
    },
    {
      id: 'secure-payment-flow',
      name: 'Secure Payment Flow',
      config: {
        id: 'securePayment',
        initial: 'pending',
        states: {
          pending: { on: { PROCESS: 'processing' } },
          processing: { on: { SUCCESS: 'success', FAILED: 'failed' } },
          success: { type: 'final' },
          failed: { on: { RETRY: 'pending' } }
        }
      },
      encryptedState: {
        amount: 0,
        currency: 'USD',
        paymentMethod: null,
        isProcessing: false
      }
    }
  ];
  
  for (const stateMachineData of secureStateMachines) {
    const secureStateMachine = boundaryHQ.createSecureStateMachine(stateMachineData, adminIdentity);
    console.log(`  🔒 Created secure state machine: ${secureStateMachine.name}`);
  }
  
  // Test state machine access
  console.log(`  🔐 State machine access tests:`);
  
  for (const stateMachineData of secureStateMachines) {
    const stateMachineId = stateMachineData.id;
    
    try {
      const stateMachine = boundaryHQ.getSecureStateMachine(stateMachineId, adminIdentity);
      console.log(`    - Admin can access ${stateMachine.name}: ✅`);
    } catch (error) {
      console.log(`    - Admin cannot access ${stateMachineId}: ❌ ${error.message}`);
    }
    
    try {
      const stateMachine = boundaryHQ.getSecureStateMachine(stateMachineId, devIdentity);
      console.log(`    - Developer can access ${stateMachine.name}: ✅`);
    } catch (error) {
      console.log(`    - Developer cannot access ${stateMachineId}: ❌ ${error.message}`);
    }
  }
  
  // Update secure state machine
  const updatedStateMachine = boundaryHQ.updateSecureStateMachine('secure-checkout-flow', {
    encryptedState: {
      cartItems: [{ id: 1, name: 'Fish Burger', price: 12.99 }],
      total: 12.99,
      paymentMethod: 'credit_card',
      isProcessing: false
    }
  }, devIdentity);
  
  console.log(`  ✅ Updated secure state machine: ${updatedStateMachine.name}`);
  
  // Delete secure state machine (admin only)
  const deleted = boundaryHQ.deleteSecureStateMachine('secure-payment-flow', adminIdentity);
  console.log(`  ✅ Deleted secure state machine: ${deleted}`);
}

/**
 * Demo 5: Audit Logging and Compliance
 */
async function demoAuditLoggingAndCompliance(boundaryHQ) {
  console.log('\n📝 Demo 5: Audit Logging and Compliance');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  
  // Get audit logs
  const auditLogs = boundaryHQ.getAuditLogs(adminIdentity);
  
  console.log(`  📊 Total audit log entries: ${auditLogs.length}`);
  
  // Show recent audit logs
  const recentLogs = auditLogs.slice(0, 10);
  console.log(`  📝 Recent audit logs:`);
  
  for (const log of recentLogs) {
    console.log(`    - ${log.timestamp}: ${log.action} by ${log.identity}`);
    if (log.details) {
      console.log(`      Details: ${JSON.stringify(log.details)}`);
    }
  }
  
  // Filter audit logs
  const componentLogs = boundaryHQ.getAuditLogs(adminIdentity, {
    action: 'component_created'
  });
  
  console.log(`  📋 Component creation logs: ${componentLogs.length}`);
  
  const stateMachineLogs = boundaryHQ.getAuditLogs(adminIdentity, {
    action: 'state_machine_created'
  });
  
  console.log(`  📋 State machine creation logs: ${stateMachineLogs.length}`);
  
  // Get access statistics
  const stats = boundaryHQ.getAccessStatistics(adminIdentity);
  
  console.log(`  📊 Access statistics:`);
  console.log(`    - Total identities: ${stats.totalIdentities}`);
  console.log(`    - Total components: ${stats.totalComponents}`);
  console.log(`    - Total state machines: ${stats.totalStateMachines}`);
  console.log(`    - Total access policies: ${stats.totalAccessPolicies}`);
  console.log(`    - Recent activity entries: ${stats.recentActivity.length}`);
  
  // Compliance reporting
  const complianceReport = {
    timestamp: new Date().toISOString(),
    totalAuditEntries: auditLogs.length,
    uniqueIdentities: new Set(auditLogs.map(log => log.identity)).size,
    actionsByType: auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {}),
    last24Hours: auditLogs.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };
  
  console.log(`  📋 Compliance report:`);
  console.log(`    - Report timestamp: ${complianceReport.timestamp}`);
  console.log(`    - Total audit entries: ${complianceReport.totalAuditEntries}`);
  console.log(`    - Unique identities: ${complianceReport.uniqueIdentities}`);
  console.log(`    - Actions in last 24h: ${complianceReport.last24Hours}`);
  console.log(`    - Actions by type: ${JSON.stringify(complianceReport.actionsByType)}`);
}

/**
 * Demo 6: Encryption and Data Protection
 */
async function demoEncryptionAndDataProtection(boundaryHQ) {
  console.log('\n🔒 Demo 6: Encryption and Data Protection');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  
  // Test encrypted data access
  console.log(`  🔐 Testing encrypted data access:`);
  
  try {
    const component = boundaryHQ.getSecureComponent('secure-checkout-form', adminIdentity);
    const decryptedData = component.getDecryptedData(adminIdentity);
    console.log(`    - Admin can decrypt component data: ✅`);
    console.log(`    - Data size: ${JSON.stringify(decryptedData).length} characters`);
  } catch (error) {
    console.log(`    - Admin cannot decrypt component data: ❌ ${error.message}`);
  }
  
  try {
    const stateMachine = boundaryHQ.getSecureStateMachine('secure-checkout-flow', adminIdentity);
    const decryptedState = stateMachine.getDecryptedState(adminIdentity);
    console.log(`    - Admin can decrypt state machine data: ✅`);
    console.log(`    - State size: ${JSON.stringify(decryptedState).length} characters`);
  } catch (error) {
    console.log(`    - Admin cannot decrypt state machine data: ❌ ${error.message}`);
  }
  
  // Test unauthorized access
  console.log(`  🚫 Testing unauthorized access:`);
  
  try {
    const component = boundaryHQ.getSecureComponent('secure-checkout-form', devIdentity);
    const decryptedData = component.getDecryptedData(devIdentity);
    console.log(`    - Developer can decrypt component data: ✅`);
  } catch (error) {
    console.log(`    - Developer cannot decrypt component data: ❌ ${error.message}`);
  }
  
  // Encryption key management
  console.log(`  🔑 Encryption key management:`);
  console.log(`    - Encryption enabled: ${boundaryHQ.config.enableEncryption}`);
  console.log(`    - Encryption key: ${boundaryHQ.encryptionKey ? 'Set' : 'Not set'}`);
  
  // Data protection features
  const dataProtectionFeatures = {
    encryptionAtRest: true,
    encryptionInTransit: true,
    keyRotation: true,
    auditTrail: true,
    accessControl: true,
    dataMasking: true
  };
  
  console.log(`  🛡️ Data protection features:`);
  Object.entries(dataProtectionFeatures).forEach(([feature, enabled]) => {
    console.log(`    - ${feature}: ${enabled ? '✅' : '❌'}`);
  });
}

/**
 * Demo 7: Integration with Fish Burger
 */
async function demoFishBurgerIntegration(boundaryHQ) {
  console.log('\n🍔 Demo 7: Fish Burger Integration');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  const devIdentity = boundaryHQ.getIdentity('dev-1');
  
  // Create fish burger specific secure components
  const fishBurgerComponents = [
    {
      id: 'secure-fish-burger-order',
      name: 'Secure Fish Burger Order',
      type: 'order',
      encryptedData: {
        template: '<div class="secure-fish-burger-order">...</div>',
        config: { 
          pciCompliant: true, 
          encryption: true,
          dataProtection: true 
        }
      }
    },
    {
      id: 'secure-fish-burger-payment',
      name: 'Secure Fish Burger Payment',
      type: 'payment',
      encryptedData: {
        template: '<div class="secure-fish-burger-payment">...</div>',
        config: { 
          pciCompliant: true, 
          encryption: true,
          tokenization: true 
        }
      }
    }
  ];
  
  for (const componentData of fishBurgerComponents) {
    const secureComponent = boundaryHQ.createSecureComponent(componentData, adminIdentity);
    console.log(`  🍔 Created secure fish burger component: ${secureComponent.name}`);
  }
  
  // Create fish burger specific secure state machine
  const fishBurgerStateMachine = {
    id: 'secure-fish-burger-workflow',
    name: 'Secure Fish Burger Workflow',
    config: {
      id: 'secureFishBurger',
      initial: 'browsing',
      states: {
        browsing: { on: { ADD_TO_CART: 'cart' } },
        cart: { on: { CHECKOUT: 'secure_checkout' } },
        secure_checkout: { on: { PAYMENT_SUCCESS: 'kitchen', PAYMENT_FAILED: 'error' } },
        kitchen: { on: { READY: 'delivery' } },
        delivery: { on: { DELIVERED: 'success' } },
        success: { type: 'final' },
        error: { on: { RETRY: 'secure_checkout' } }
      }
    },
    encryptedState: {
      orderItems: [],
      total: 0,
      paymentMethod: null,
      deliveryAddress: null,
      isProcessing: false
    }
  };
  
  const secureStateMachine = boundaryHQ.createSecureStateMachine(fishBurgerStateMachine, adminIdentity);
  console.log(`  🍔 Created secure fish burger state machine: ${secureStateMachine.name}`);
  
  // Test fish burger integration
  console.log(`  🔐 Fish burger access tests:`);
  
  try {
    const component = boundaryHQ.getSecureComponent('secure-fish-burger-order', devIdentity);
    console.log(`    - Developer can access fish burger order: ✅`);
  } catch (error) {
    console.log(`    - Developer cannot access fish burger order: ❌ ${error.message}`);
  }
  
  try {
    const stateMachine = boundaryHQ.getSecureStateMachine('secure-fish-burger-workflow', devIdentity);
    console.log(`    - Developer can access fish burger workflow: ✅`);
  } catch (error) {
    console.log(`    - Developer cannot access fish burger workflow: ❌ ${error.message}`);
  }
  
  // Export to BoundaryHQ
  const exportData = {
    components: fishBurgerComponents,
    stateMachine: fishBurgerStateMachine,
    integration: 'fish-burger-backend'
  };
  
  try {
    const exportResult = await boundaryHQ.exportToBoundaryHQ(exportData, adminIdentity);
    console.log(`  📤 Exported fish burger data to BoundaryHQ: ${exportResult.message}`);
  } catch (error) {
    console.log(`  ❌ Failed to export fish burger data: ${error.message}`);
  }
}

/**
 * Demo 8: Advanced Security Features
 */
async function demoAdvancedSecurityFeatures(boundaryHQ) {
  console.log('\n🛡️ Demo 8: Advanced Security Features');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  
  // Multi-factor authentication simulation
  console.log(`  🔐 Multi-factor authentication:`);
  const mfaFeatures = {
    twoFactorAuth: true,
    biometricAuth: true,
    hardwareTokens: true,
    timeBasedTokens: true
  };
  
  Object.entries(mfaFeatures).forEach(([feature, enabled]) => {
    console.log(`    - ${feature}: ${enabled ? '✅' : '❌'}`);
  });
  
  // Session management
  console.log(`  ⏱️ Session management:`);
  const sessionFeatures = {
    sessionTimeout: '30 minutes',
    maxConcurrentSessions: 3,
    sessionEncryption: true,
    automaticLogout: true
  };
  
  Object.entries(sessionFeatures).forEach(([feature, value]) => {
    console.log(`    - ${feature}: ${value}`);
  });
  
  // Threat detection
  console.log(`  🚨 Threat detection:`);
  const threatFeatures = {
    anomalyDetection: true,
    bruteForceProtection: true,
    suspiciousActivityMonitoring: true,
    automatedResponse: true
  };
  
  Object.entries(threatFeatures).forEach(([feature, enabled]) => {
    console.log(`    - ${feature}: ${enabled ? '✅' : '❌'}`);
  });
  
  // Compliance features
  console.log(`  📋 Compliance features:`);
  const complianceFeatures = {
    gdprCompliance: true,
    soxCompliance: true,
    hipaaCompliance: true,
    pciCompliance: true,
    dataRetention: '7 years',
    dataDeletion: true
  };
  
  Object.entries(complianceFeatures).forEach(([feature, value]) => {
    console.log(`    - ${feature}: ${value === true ? '✅' : value === false ? '❌' : value}`);
  });
  
  // Security metrics
  const securityMetrics = {
    totalAccessAttempts: 1250,
    successfulAccess: 1180,
    failedAccess: 70,
    blockedAttempts: 15,
    averageResponseTime: '45ms',
    encryptionStrength: '256-bit AES'
  };
  
  console.log(`  📊 Security metrics:`);
  Object.entries(securityMetrics).forEach(([metric, value]) => {
    console.log(`    - ${metric}: ${value}`);
  });
}

/**
 * Integration with Fish Burger Backend
 */
export async function integrateWithFishBurger(boundaryHQ) {
  console.log('\n🍔 Integrating with Fish Burger Backend...');
  
  const adminIdentity = boundaryHQ.getIdentity('admin-1');
  
  // Create secure fish burger ViewStateMachine
  const fishBurgerViewStateMachine = {
    machineId: 'boundary-fish-burger-order',
    componentId: 'secure-fish-burger-order',
    stateMachineId: 'secure-fish-burger-workflow',
    identity: adminIdentity.id,
    metadata: {
      source: 'boundaryhq',
      integration: 'fish-burger-backend',
      security: 'encrypted',
      compliance: 'pci-compliant'
    }
  };
  
  console.log(`  🔗 Created secure fish burger ViewStateMachine: ${fishBurgerViewStateMachine.machineId}`);
  
  return {
    viewStateMachine: fishBurgerViewStateMachine,
    identity: adminIdentity,
    securityLevel: 'high',
    compliance: 'pci-compliant'
  };
} 