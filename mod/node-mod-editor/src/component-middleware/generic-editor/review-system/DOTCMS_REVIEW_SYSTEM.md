# dotCMS Review System Documentation

## 🎯 **Overview**

The dotCMS Review System is a comprehensive solution for preventing publishing mistakes by requiring proper review workflows before content can be published to production. It includes special admin permissions, diff modal integration, and resource-level security to ensure only authorized changes are published.

## 🏗️ **Architecture**

### ✅ **Core Components**

1. **ReviewManager** - Manages review workflows and permissions
2. **Review Page** - Separate page with diff modal integration
3. **dotCMS Resources** - Special resource types with admin permissions
4. **Admin Permissions** - Restricted access to prevent publishing mistakes
5. **Diff Modal** - Visual comparison of original vs modified content

### ✅ **File Structure**

```
review-system/
├── review-manager.js           # Review workflow management
├── review-page.html            # Separate review page with diff modal
├── dotcms-resources.js         # dotCMS resource configurations
├── demo-review.js              # Review system demo
└── DOTCMS_REVIEW_SYSTEM.md    # This documentation
```

## 🔐 **Admin Permissions & Security**

### ✅ **Special Admin Permissions**

The review system implements strict admin permissions to prevent publishing mistakes:

```javascript
// Admin users who can override review restrictions
adminUsers: [
  'johnholland',
  'admin', 
  'developer'
]

// Admin-only fields that cannot be modified by regular users
adminOnlyFields: [
  'adminApprovedBy',
  'adminApprovedAt', 
  'adminOverride',
  'requiresAdminApproval',
  'adminOnly'
]
```

### ✅ **Resource-Level Security**

```javascript
// dotCMS resource permissions
permissions: {
  admin: ['read', 'write', 'delete', 'publish'],
  reviewer: ['read', 'write'],
  user: ['read'],
  guest: ['read']
}
```

### ✅ **Admin-Only Operations**

- **Review Deletion** - Only admins can delete reviews
- **Status Modification** - Only admins can change review status to approved
- **Admin Field Modification** - Only admins can modify admin-only fields
- **Override Permissions** - Only admins can override review restrictions

## 📋 **Review Workflow**

### ✅ **Review States**

1. **Pending** - Review is waiting for reviewers
2. **In Review** - Review is currently being reviewed
3. **Approved** - Review has been approved by all reviewers
4. **Rejected** - Review has been rejected
5. **Needs Changes** - Review needs changes before approval
6. **Pending Admin Approval** - Review is pending admin approval
7. **Published** - Review has been published to production
8. **Cancelled** - Review has been cancelled

### ✅ **Workflow Actions**

```javascript
actions: {
  submitForReview: { fromStates: ['draft'], toState: 'pending' },
  startReview: { fromStates: ['pending'], toState: 'in_review' },
  approveReview: { fromStates: ['in_review'], toState: 'approved' },
  rejectReview: { fromStates: ['in_review'], toState: 'rejected' },
  adminApprove: { fromStates: ['pending_admin_approval'], toState: 'approved' },
  publish: { fromStates: ['approved'], toState: 'published' }
}
```

## 🎨 **Review Page with Diff Modal**

### ✅ **Separate Review Page**

The review system includes a dedicated page (`review-page.html`) that:

- Lists all reviews with filtering and search
- Shows review status and metadata
- Provides diff modal for visual comparison
- Enforces admin permissions
- Tracks review history

### ✅ **Diff Modal Integration**

```html
<!-- Diff Modal -->
<div class="diff-modal" id="diff-modal">
  <div class="diff-modal-content">
    <div class="diff-modal-header">
      <h2 id="diff-modal-title">Review Changes</h2>
      <button class="diff-modal-close">&times;</button>
    </div>
    <div class="diff-modal-body">
      <div class="diff-content" id="diff-content">
        <!-- Diff content loaded here -->
      </div>
    </div>
    <div class="diff-modal-footer">
      <button onclick="closeDiffModal()">Close</button>
      <button onclick="rejectReview()">Reject</button>
      <button onclick="approveReview()">Approve</button>
    </div>
  </div>
</div>
```

### ✅ **Diff Generation**

```javascript
generateDiffData(original, modified) {
  const diff = {
    additions: [],
    deletions: [],
    modifications: []
  };

  // Compare original and modified content
  // Generate line-by-line diff
  // Highlight additions, deletions, and modifications

  return diff;
}
```

## 🏗️ **dotCMS Resource Configuration**

### ✅ **ReviewResource Content Type**

```javascript
ReviewResource: {
  contentType: 'ReviewResource',
  name: 'Review Resource',
  folder: '/reviews',
  
  // Special admin permissions
  permissions: {
    admin: ['read', 'write', 'delete', 'publish'],
    reviewer: ['read', 'write'],
    user: ['read'],
    guest: ['read']
  },
  
  // Admin-only fields
  adminOnlyFields: [
    'adminApprovedBy',
    'adminApprovedAt',
    'adminOverride',
    'requiresAdminApproval',
    'adminOnly'
  ],
  
  // Fields that require admin approval
  restrictedFields: [
    'status',
    'reviewHistory',
    'diffData',
    'adminApprovedBy',
    'adminApprovedAt'
  ]
}
```

### ✅ **ReviewHistoryResource**

Tracks detailed history of review submissions:

```javascript
ReviewHistoryResource: {
  contentType: 'ReviewHistoryResource',
  name: 'Review History Resource',
  folder: '/reviews/history',
  
  fields: {
    reviewId: { type: 'text', required: true },
    submissionId: { type: 'text', required: true },
    reviewerId: { type: 'text', required: true },
    status: { type: 'select', values: ['approved', 'rejected', 'needs_changes'] },
    comments: { type: 'textarea' },
    timestamp: { type: 'date', required: true },
    diffApproved: { type: 'checkbox' },
    adminOverride: { type: 'checkbox' },
    ipAddress: { type: 'text' },
    userAgent: { type: 'text' }
  }
}
```

### ✅ **ReviewSettingsResource**

System-wide configuration:

```javascript
ReviewSettingsResource: {
  contentType: 'ReviewSettingsResource',
  name: 'Review Settings Resource',
  folder: '/reviews/settings',
  
  fields: {
    settingKey: { type: 'text', required: true },
    settingValue: { type: 'text', required: true },
    description: { type: 'textarea' },
    category: { type: 'select', values: ['general', 'permissions', 'workflow', 'notifications'] },
    isActive: { type: 'checkbox', defaultValue: true },
    lastModified: { type: 'date', required: true },
    modifiedBy: { type: 'text', required: true }
  }
}
```

## 🔒 **Security Features**

### ✅ **Permission Validation**

```javascript
// Check if user has admin permissions
hasAdminPermissions(userId) {
  return this.adminUsers.has(userId);
}

// Check if user has review permissions
hasReviewPermissions(userId, reviewId) {
  const review = this.reviews.get(reviewId);
  if (!review) return false;
  
  // Admin users always have review permissions
  if (this.hasAdminPermissions(userId)) return true;
  
  // Check if user is assigned as reviewer
  return review.reviewers.includes(userId);
}
```

### ✅ **Admin-Only Operations Protection**

```javascript
// Admin approval for review
adminApproveReview(reviewId, adminUserId) {
  if (!this.hasAdminPermissions(adminUserId)) {
    throw new Error('User does not have admin permissions');
  }
  
  // Proceed with admin approval
  // Update review status
  // Create audit trail
}

// Delete review (admin only)
deleteReview(reviewId, adminUserId) {
  if (!this.hasAdminPermissions(adminUserId)) {
    throw new Error('User does not have admin permissions');
  }
  
  // Proceed with deletion
  // Clean up resources
  // Update audit trail
}
```

### ✅ **Field-Level Security**

```javascript
// Admin-only fields that cannot be modified by regular users
adminOnlyFields: [
  'adminApprovedBy',
  'adminApprovedAt',
  'adminOverride',
  'requiresAdminApproval',
  'adminOnly'
]

// Fields that require admin approval to modify
restrictedFields: [
  'status',
  'reviewHistory',
  'diffData',
  'adminApprovedBy',
  'adminApprovedAt'
]
```

## 📧 **Notification System**

### ✅ **Notification Types**

```javascript
types: {
  reviewCreated: {
    template: 'A new review "{reviewName}" has been created by {createdBy}',
    recipients: ['reviewers', 'admins']
  },
  reviewAssigned: {
    template: 'You have been assigned to review "{reviewName}"',
    recipients: ['assigned_reviewer']
  },
  reviewApproved: {
    template: 'Review "{reviewName}" has been approved by {reviewer}',
    recipients: ['reviewers', 'admins', 'creator']
  },
  adminApprovalRequired: {
    template: 'Admin approval required for review "{reviewName}"',
    recipients: ['admins']
  }
}
```

### ✅ **Notification Channels**

```javascript
channels: {
  email: { enabled: true, template: 'email-template.html' },
  inApp: { enabled: true, template: 'in-app-notification.html' },
  slack: { enabled: false, webhook: 'https://hooks.slack.com/services/...' }
}
```

## 🚀 **Usage Examples**

### ✅ **Creating a Review**

```javascript
const review = reviewManager.createReview({
  name: 'Homepage Content Update',
  description: 'Update homepage content with new marketing copy',
  reviewers: ['reviewer1', 'reviewer2'],
  originalContent: '<div>Old content</div>',
  modifiedContent: '<div>New content</div>',
  createdBy: 'user1',
  adminOnly: false,
  requiresAdminApproval: false
});
```

### ✅ **Submitting a Review**

```javascript
const submission = reviewManager.submitReview(reviewId, userId, {
  status: 'approved',
  comments: 'Content looks good, approved for publishing',
  diffApproved: true
});
```

### ✅ **Admin Approval**

```javascript
const approvedReview = reviewManager.adminApproveReview(reviewId, adminUserId);
```

### ✅ **Checking Permissions**

```javascript
// Check if user has admin permissions
const isAdmin = reviewManager.hasAdminPermissions(userId);

// Check if user can review
const canReview = reviewManager.hasReviewPermissions(userId, reviewId);
```

## 🎯 **Benefits**

### ✅ **Prevention of Publishing Mistakes**

- **Required Reviews** - All changes must go through review process
- **Admin Approval** - Sensitive changes require admin approval
- **Diff Visualization** - Clear visual comparison of changes
- **Audit Trail** - Complete history of all review actions

### ✅ **Security & Compliance**

- **Admin-Only Fields** - Protected fields cannot be modified by regular users
- **Resource Permissions** - dotCMS resource-level security
- **Role-Based Access** - Different permissions for different roles
- **Audit Logging** - Complete audit trail for compliance

### ✅ **Developer Experience**

- **Separate Review Page** - Dedicated interface for reviews
- **Diff Modal** - Visual comparison of changes
- **Filtering & Search** - Easy to find specific reviews
- **Status Tracking** - Clear visibility of review status

### ✅ **dotCMS Integration**

- **Resource Management** - Native dotCMS resource types
- **Permission System** - Leverages dotCMS permission system
- **Workflow Integration** - Integrates with dotCMS workflows
- **Notification System** - Uses dotCMS notification channels

## 🔮 **Future Enhancements**

### ✅ **Planned Features**

1. **Real-time Collaboration** - Multiple reviewers working simultaneously
2. **Advanced Diff** - More sophisticated diff algorithms
3. **Automated Testing** - Integration with automated testing
4. **Performance Monitoring** - Track review performance metrics
5. **Mobile Support** - Mobile-friendly review interface
6. **API Integration** - REST API for external integrations
7. **Advanced Notifications** - More sophisticated notification system
8. **Review Templates** - Pre-built review templates

### ✅ **Production Considerations**

1. **Environment Configuration** - Different settings for dev/staging/prod
2. **Backup & Recovery** - Regular backup of review data
3. **Performance Optimization** - Efficient diff generation and storage
4. **Security Hardening** - Additional security measures for production
5. **Monitoring & Alerting** - Proactive monitoring of review system

## 🎉 **Conclusion**

The dotCMS Review System provides a comprehensive solution for preventing publishing mistakes through:

- ✅ **Strict Admin Permissions** - Only authorized users can make sensitive changes
- ✅ **Visual Diff Comparison** - Clear visualization of changes before approval
- ✅ **Workflow Management** - Structured review process with multiple states
- ✅ **Resource Security** - dotCMS resource-level permissions and protection
- ✅ **Audit Trail** - Complete history of all review actions
- ✅ **Notification System** - Automated notifications for review events

This system ensures that no content can be published to production without proper review and approval, significantly reducing the risk of publishing mistakes while maintaining a smooth development workflow. 