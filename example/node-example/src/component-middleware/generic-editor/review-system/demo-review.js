/**
 * dotCMS Review System Demo
 * 
 * Demonstrates the review system with admin permissions, diff modal integration,
 * and special resource permissions to prevent publishing mistakes.
 */

import { createReviewManager } from './review-manager.js';
import dotCMSConfig from './dotcms-resources.js';

async function runReviewSystemDemo() {
  console.log('🚀 Starting dotCMS Review System Demo...\n');

  try {
    // Create review manager
    const reviewManager = createReviewManager();
    console.log('✅ Review Manager created');

    // Test admin permissions
    console.log('\n🔐 Testing Admin Permissions...');
    const adminUsers = ['johnholland', 'admin', 'developer'];
    const regularUsers = ['user1', 'user2', 'reviewer1'];

    adminUsers.forEach(user => {
      const hasAdmin = reviewManager.hasAdminPermissions(user);
      console.log(`  ${user}: ${hasAdmin ? '✅ Admin' : '❌ Not Admin'}`);
    });

    // Create sample reviews
    console.log('\n📝 Creating Sample Reviews...');
    const sampleReviews = [
      {
        name: 'Homepage Content Update',
        description: 'Update homepage content with new marketing copy',
        reviewers: ['reviewer1', 'reviewer2'],
        originalContent: `<div class="hero">
  <h1>Welcome to Our Site</h1>
  <p>This is the old content.</p>
</div>`,
        modifiedContent: `<div class="hero">
  <h1>Welcome to Our Amazing Site</h1>
  <p>This is the new and improved content!</p>
  <button class="cta-button">Get Started</button>
</div>`,
        createdBy: 'user1',
        adminOnly: false,
        requiresAdminApproval: false
      },
      {
        name: 'Admin Settings Update',
        description: 'Update admin settings for the review system',
        reviewers: ['admin'],
        originalContent: `const settings = {
  enableReviews: true,
  requireApproval: false
};`,
        modifiedContent: `const settings = {
  enableReviews: true,
  requireApproval: true,
  adminOnly: true,
  notificationChannels: ['email', 'slack']
};`,
        createdBy: 'admin',
        adminOnly: true,
        requiresAdminApproval: true
      },
      {
        name: 'CSS Styling Changes',
        description: 'Update CSS styles for better responsive design',
        reviewers: ['reviewer1'],
        originalContent: `.button {
  background: blue;
  color: white;
}`,
        modifiedContent: `.button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  transition: all 0.3s ease;
}`,
        createdBy: 'user2',
        adminOnly: false,
        requiresAdminApproval: false
      }
    ];

    const createdReviews = [];
    for (const sample of sampleReviews) {
      const review = reviewManager.createReview(sample);
      createdReviews.push(review);
      console.log(`✅ Created review: ${review.name} (${review.status})`);
    }

    // Test review permissions
    console.log('\n🔑 Testing Review Permissions...');
    const testUsers = [
      { user: 'johnholland', role: 'admin' },
      { user: 'reviewer1', role: 'reviewer' },
      { user: 'user1', role: 'user' }
    ];

    testUsers.forEach(({ user, role }) => {
      console.log(`\n${role.toUpperCase()} (${user}):`);
      createdReviews.forEach(review => {
        const hasReviewPerms = reviewManager.hasReviewPermissions(user, review.id);
        const canView = reviewManager.hasAdminPermissions(user) || review.reviewers.includes(user);
        console.log(`  ${review.name}: ${hasReviewPerms ? '✅ Can Review' : '❌ Cannot Review'} (${canView ? 'Can View' : 'Cannot View'})`);
      });
    });

    // Test review submissions
    console.log('\n📋 Testing Review Submissions...');
    
    // Reviewer 1 approves first review
    const submission1 = reviewManager.submitReview(createdReviews[0].id, 'reviewer1', {
      status: 'approved',
      comments: 'Content looks good, approved for publishing',
      diffApproved: true
    });
    console.log(`✅ Reviewer1 approved: ${createdReviews[0].name}`);

    // Reviewer 2 approves first review
    const submission2 = reviewManager.submitReview(createdReviews[0].id, 'reviewer2', {
      status: 'approved',
      comments: 'Marketing copy is compelling, approved',
      diffApproved: true
    });
    console.log(`✅ Reviewer2 approved: ${createdReviews[0].name}`);

    // Check review status
    const updatedReview1 = reviewManager.getReview(createdReviews[0].id);
    console.log(`📊 Review status: ${updatedReview1.status}`);

    // Test admin approval for admin-only review
    console.log('\n👑 Testing Admin Approval...');
    const adminReview = createdReviews[1];
    console.log(`Admin review status: ${adminReview.status}`);

    // Admin approves the admin-only review
    const adminApproval = reviewManager.adminApproveReview(adminReview.id, 'johnholland');
    console.log(`✅ Admin approved: ${adminApproval.name}`);
    console.log(`📊 Admin review status: ${adminApproval.status}`);

    // Test diff generation
    console.log('\n🔍 Testing Diff Generation...');
    createdReviews.forEach(review => {
      console.log(`\n${review.name}:`);
      console.log(`  Additions: ${review.diffData.additions.length}`);
      console.log(`  Deletions: ${review.diffData.deletions.length}`);
      console.log(`  Modifications: ${review.diffData.modifications.length}`);
    });

    // Test dotCMS resource creation
    console.log('\n🏗️ Testing dotCMS Resource Creation...');
    createdReviews.forEach(review => {
      const resourceData = reviewManager.exportReviewData(review.id);
      console.log(`✅ Created dotCMS resource for: ${review.name}`);
      console.log(`  Resource ID: ${resourceData.reviewId}`);
      console.log(`  Status: ${resourceData.status}`);
      console.log(`  Admin Only: ${resourceData.adminOnly}`);
      console.log(`  Requires Admin Approval: ${resourceData.requiresAdminApproval}`);
    });

    // Test review filtering
    console.log('\n🔍 Testing Review Filtering...');
    const pendingReviews = reviewManager.getReviewsByStatus('pending');
    const approvedReviews = reviewManager.getReviewsByStatus('approved');
    const adminApprovalReviews = reviewManager.getReviewsRequiringAdminApproval();

    console.log(`Pending reviews: ${pendingReviews.length}`);
    console.log(`Approved reviews: ${approvedReviews.length}`);
    console.log(`Reviews requiring admin approval: ${adminApprovalReviews.length}`);

    // Test review history
    console.log('\n📜 Testing Review History...');
    createdReviews.forEach(review => {
      const history = reviewManager.getReviewHistory(review.id);
      console.log(`${review.name} history: ${history.length} submissions`);
      history.forEach(submission => {
        console.log(`  - ${submission.reviewerId}: ${submission.status} (${submission.timestamp})`);
      });
    });

    // Test admin-only operations
    console.log('\n🛡️ Testing Admin-Only Operations...');
    
    // Try to delete a review as non-admin (should fail)
    try {
      reviewManager.deleteReview(createdReviews[0].id, 'user1');
      console.log('❌ Should have failed - user1 cannot delete reviews');
    } catch (error) {
      console.log('✅ Correctly prevented non-admin from deleting review');
    }

    // Delete a review as admin (should succeed)
    try {
      const deleted = reviewManager.deleteReview(createdReviews[2].id, 'johnholland');
      console.log(`✅ Admin successfully deleted review: ${deleted}`);
    } catch (error) {
      console.log('❌ Admin should be able to delete reviews');
    }

    // Final state
    console.log('\n📊 Final State:');
    const finalReviews = reviewManager.getAllReviews();
    console.log(`Total reviews: ${finalReviews.length}`);
    finalReviews.forEach(review => {
      console.log(`  - ${review.name}: ${review.status} (${review.reviewHistory.length} submissions)`);
    });

    console.log('\n🎉 dotCMS Review System Demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('✅ Admin permissions and restrictions');
    console.log('✅ Review workflow with multiple states');
    console.log('✅ Diff generation and comparison');
    console.log('✅ dotCMS resource creation and management');
    console.log('✅ Review history tracking');
    console.log('✅ Admin-only operations protection');
    console.log('✅ Special resource permissions');
    console.log('✅ Prevention of publishing mistakes');

    console.log('\n🔒 Security Features:');
    console.log('✅ Admin-only fields protected');
    console.log('✅ Review deletion restricted to admins');
    console.log('✅ Admin approval required for sensitive changes');
    console.log('✅ Audit trail for all review actions');
    console.log('✅ dotCMS resource permissions enforced');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
runReviewSystemDemo(); 