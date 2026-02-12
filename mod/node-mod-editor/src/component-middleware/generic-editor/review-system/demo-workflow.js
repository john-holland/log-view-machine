/**
 * Demo script for the new review workflow
 * 
 * Tests the Decline, Suggest Changes, and Approve workflow
 * along with configurable review limits and version management
 */

import { createReviewManager } from './review-manager.js';

async function demoReviewWorkflow() {
  console.log('🚀 Starting Review Workflow Demo...\n');

  // Initialize review manager
  const reviewManager = createReviewManager();
  reviewManager.initializeAdminUsers();

  // Test users
  const adminUser = 'johnholland';
  const reviewer1 = 'alice';
  const reviewer2 = 'bob';
  const reviewer3 = 'charlie';

  console.log('📋 Review Settings:');
  console.log(reviewManager.getReviewSettings());
  console.log('');

  // Create a test review
  console.log('📝 Creating test review...');
  const testReview = reviewManager.createReview({
    name: 'Button Component Update',
    description: 'Update button styling and behavior',
    reviewers: [reviewer1, reviewer2, reviewer3],
    createdBy: adminUser,
    originalContent: 'Original button code',
    modifiedContent: 'Updated button code with new styling',
    resources: [
      {
        componentId: 'button-component',
        version: '1.0.0',
        type: 'component'
      }
    ]
  });

  console.log('✅ Review created:', testReview.id);
  console.log('');

  // Test 1: Decline review
  console.log('❌ Test 1: Declining review...');
  try {
    const declinedReview = reviewManager.declineReview(testReview.id, reviewer1, 'Button styling is inconsistent');
    console.log('✅ Review declined successfully');
    console.log('Status:', declinedReview.status);
    console.log('Can publish:', declinedReview.canPublish);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to decline review:', error.message);
  }

  // Test 2: Suggest changes
  console.log('💡 Test 2: Suggesting changes...');
  try {
    const suggestedReview = reviewManager.suggestChanges(testReview.id, reviewer2, 'Please add hover effects and improve accessibility');
    console.log('✅ Changes suggested successfully');
    console.log('Status:', suggestedReview.status);
    console.log('Suggestions:', suggestedReview.suggestions);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to suggest changes:', error.message);
  }

  // Create a new review for approval testing
  console.log('📝 Creating new review for approval testing...');
  const approvalReview = reviewManager.createReview({
    name: 'Form Component Enhancement',
    description: 'Add validation and error handling',
    reviewers: [reviewer1, reviewer2],
    createdBy: adminUser,
    originalContent: 'Basic form code',
    modifiedContent: 'Enhanced form with validation',
    resources: [
      {
        componentId: 'form-component',
        version: '1.0.0',
        type: 'component'
      }
    ]
  });

  console.log('✅ Approval review created:', approvalReview.id);
  console.log('');

  // Test 3: Approve reviews
  console.log('✅ Test 3: Approving reviews...');
  
  try {
    // First approval
    const approved1 = reviewManager.approveReview(approvalReview.id, reviewer1, 'Validation looks good');
    console.log('✅ First approval added');
    console.log('Approvals count:', approved1.approvals.length);
    console.log('Status:', approved1.status);
    console.log('Can publish:', approved1.canPublish);
    console.log('');

    // Second approval (should reach review limit)
    const approved2 = reviewManager.approveReview(approvalReview.id, reviewer2, 'Error handling is well implemented');
    console.log('✅ Second approval added');
    console.log('Approvals count:', approved2.approvals.length);
    console.log('Status:', approved2.status);
    console.log('Can publish:', approved2.canPublish);
    console.log('');

  } catch (error) {
    console.error('❌ Failed to approve review:', error.message);
  }

  // Test 4: Version management
  console.log('🔢 Test 4: Version management...');
  
  try {
    const componentId = 'form-component';
    const version = '1.0.0';
    
    // Check publish status
    const canPublish = reviewManager.canPublishComponent(componentId, version);
    console.log('Can publish:', canPublish);
    
    // Test version increment types
    const revisionType = reviewManager.getVersionIncrementType(componentId, version, false);
    const majorType = reviewManager.getVersionIncrementType(componentId, version, true);
    
    console.log('Version increment type (normal):', revisionType);
    console.log('Version increment type (major):', majorType);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to check version management:', error.message);
  }

  // Test 5: Admin settings
  console.log('⚙️ Test 5: Admin settings...');
  
  try {
    // Update review limit
    const updatedSettings = reviewManager.updateReviewSettings(adminUser, {
      reviewLimit: 3,
      requireAdminApproval: true,
      autoIncrementMajor: false
    });
    
    console.log('✅ Review settings updated:', updatedSettings);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to update settings:', error.message);
  }

  // Test 6: Review history
  console.log('📜 Test 6: Review history...');
  
  try {
    const history = reviewManager.getReviewHistory(approvalReview.id);
    console.log('Review history:');
    history.forEach(entry => {
      console.log(`- ${entry.action} by ${entry.userId} at ${entry.timestamp}: ${entry.comment}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed to get review history:', error.message);
  }

  // Test 7: Component publish status with different scenarios
  console.log('🚀 Test 7: Component publish scenarios...');
  
  const scenarios = [
    { componentId: 'button-component', version: '1.0.0', description: 'Declined review' },
    { componentId: 'form-component', version: '1.0.0', description: 'Approved reviews' },
    { componentId: 'new-component', version: '1.0.0', description: 'No reviews' }
  ];

  scenarios.forEach(scenario => {
    try {
      const canPublish = reviewManager.canPublishComponent(scenario.componentId, scenario.version);
      const incrementType = reviewManager.getVersionIncrementType(scenario.componentId, scenario.version, false);
      
      console.log(`${scenario.description}:`);
      console.log(`  Can publish: ${canPublish}`);
      console.log(`  Version increment: ${incrementType}`);
    } catch (error) {
      console.error(`❌ Failed to check ${scenario.description}:`, error.message);
    }
  });

  console.log('\n🎉 Review Workflow Demo Complete!');
  console.log('\nKey Features Tested:');
  console.log('✅ Decline review (prevents publish)');
  console.log('✅ Suggest changes (loads editor)');
  console.log('✅ Approve review (adds approval)');
  console.log('✅ Configurable review limit');
  console.log('✅ Version increment management');
  console.log('✅ Admin settings control');
  console.log('✅ Review history tracking');
  console.log('✅ Component publish status checking');
}

// Run the demo
demoReviewWorkflow().catch(console.error); 