/**
 * dotCMS Resource Configuration for Review System
 * 
 * Defines special admin permissions and resource structures for the review system
 * to prevent publishing mistakes and ensure proper review workflows.
 */

export const dotCMSReviewResources = {
  // Review Resource Content Type
  ReviewResource: {
    contentType: 'ReviewResource',
    name: 'Review Resource',
    description: 'Resource for tracking review workflows and preventing publishing mistakes',
    folder: '/reviews',
    
    // Special admin permissions - only admins can modify review resources
    permissions: {
      admin: ['read', 'write', 'delete', 'publish'],
      reviewer: ['read', 'write'],
      user: ['read'],
      guest: ['read']
    },
    
    // Admin-only fields that cannot be modified by regular users
    adminOnlyFields: [
      'adminApprovedBy',
      'adminApprovedAt',
      'adminOverride',
      'requiresAdminApproval',
      'adminOnly'
    ],
    
    // Fields that require admin approval to modify
    restrictedFields: [
      'status',
      'reviewHistory',
      'diffData',
      'adminApprovedBy',
      'adminApprovedAt'
    ],
    
    // Content type fields
    fields: {
      reviewId: {
        type: 'text',
        required: true,
        indexed: true
      },
      name: {
        type: 'text',
        required: true,
        indexed: true
      },
      description: {
        type: 'textarea',
        required: false
      },
      status: {
        type: 'select',
        required: true,
        values: ['pending', 'in_review', 'approved', 'rejected', 'pending_admin_approval'],
        defaultValue: 'pending'
      },
      createdAt: {
        type: 'date',
        required: true,
        indexed: true
      },
      createdBy: {
        type: 'text',
        required: true,
        indexed: true
      },
      reviewers: {
        type: 'text',
        required: false,
        description: 'Comma-separated list of reviewer user IDs'
      },
      reviewHistory: {
        type: 'json',
        required: false,
        description: 'JSON array of review submissions'
      },
      diffData: {
        type: 'json',
        required: false,
        description: 'JSON object containing diff information'
      },
      originalContent: {
        type: 'textarea',
        required: false,
        description: 'Original content before changes'
      },
      modifiedContent: {
        type: 'textarea',
        required: false,
        description: 'Modified content after changes'
      },
      adminOnly: {
        type: 'checkbox',
        required: false,
        defaultValue: false,
        description: 'Whether this review is admin-only'
      },
      requiresAdminApproval: {
        type: 'checkbox',
        required: false,
        defaultValue: false,
        description: 'Whether this review requires admin approval'
      },
      adminApprovedBy: {
        type: 'text',
        required: false,
        description: 'User ID of admin who approved the review'
      },
      adminApprovedAt: {
        type: 'date',
        required: false,
        description: 'Timestamp when admin approved the review'
      },
      adminOverride: {
        type: 'checkbox',
        required: false,
        defaultValue: false,
        description: 'Whether admin override was used'
      },
      resources: {
        type: 'text',
        required: false,
        description: 'Comma-separated list of affected dotCMS resources'
      }
    },
    
    // Validation rules
    validation: {
      // Only admins can change status to approved
      statusApproval: {
        rule: 'adminOnly',
        message: 'Only administrators can approve reviews'
      },
      
      // Admin-only reviews require admin approval
      adminOnlyApproval: {
        rule: 'adminRequired',
        message: 'Admin-only reviews require admin approval'
      },
      
      // Cannot modify admin-only fields without admin permissions
      adminFieldsProtection: {
        rule: 'adminFieldsProtected',
        message: 'Admin-only fields cannot be modified without admin permissions'
      }
    }
  },

  // Review History Resource (for detailed tracking)
  ReviewHistoryResource: {
    contentType: 'ReviewHistoryResource',
    name: 'Review History Resource',
    description: 'Detailed history of review submissions and changes',
    folder: '/reviews/history',
    
    permissions: {
      admin: ['read', 'write', 'delete'],
      reviewer: ['read'],
      user: ['read'],
      guest: []
    },
    
    fields: {
      reviewId: {
        type: 'text',
        required: true,
        indexed: true
      },
      submissionId: {
        type: 'text',
        required: true,
        indexed: true
      },
      reviewerId: {
        type: 'text',
        required: true,
        indexed: true
      },
      status: {
        type: 'select',
        required: true,
        values: ['approved', 'rejected', 'needs_changes'],
        defaultValue: 'needs_changes'
      },
      comments: {
        type: 'textarea',
        required: false
      },
      timestamp: {
        type: 'date',
        required: true,
        indexed: true
      },
      diffApproved: {
        type: 'checkbox',
        required: false,
        defaultValue: false
      },
      adminOverride: {
        type: 'checkbox',
        required: false,
        defaultValue: false
      },
      ipAddress: {
        type: 'text',
        required: false,
        description: 'IP address of reviewer for audit trail'
      },
      userAgent: {
        type: 'text',
        required: false,
        description: 'User agent of reviewer for audit trail'
      }
    }
  },

  // Review Settings Resource (for system configuration)
  ReviewSettingsResource: {
    contentType: 'ReviewSettingsResource',
    name: 'Review Settings Resource',
    description: 'System-wide review settings and configuration',
    folder: '/reviews/settings',
    
    permissions: {
      admin: ['read', 'write', 'delete'],
      reviewer: ['read'],
      user: ['read'],
      guest: []
    },
    
    fields: {
      settingKey: {
        type: 'text',
        required: true,
        indexed: true
      },
      settingValue: {
        type: 'text',
        required: true
      },
      description: {
        type: 'textarea',
        required: false
      },
      category: {
        type: 'select',
        required: true,
        values: ['general', 'permissions', 'workflow', 'notifications'],
        defaultValue: 'general'
      },
      isActive: {
        type: 'checkbox',
        required: false,
        defaultValue: true
      },
      lastModified: {
        type: 'date',
        required: true
      },
      modifiedBy: {
        type: 'text',
        required: true
      }
    }
  }
};

/**
 * dotCMS Permission Configuration
 */
export const dotCMSPermissions = {
  // Admin users who can override review restrictions
  adminUsers: [
    'johnholland',
    'admin',
    'developer'
  ],
  
  // Review permissions by role
  rolePermissions: {
    admin: {
      canCreateReviews: true,
      canEditReviews: true,
      canDeleteReviews: true,
      canApproveReviews: true,
      canOverrideReviews: true,
      canViewAllReviews: true,
      canModifyAdminFields: true
    },
    reviewer: {
      canCreateReviews: true,
      canEditReviews: false,
      canDeleteReviews: false,
      canApproveReviews: true,
      canOverrideReviews: false,
      canViewAllReviews: true,
      canModifyAdminFields: false
    },
    user: {
      canCreateReviews: true,
      canEditReviews: false,
      canDeleteReviews: false,
      canApproveReviews: false,
      canOverrideReviews: false,
      canViewAllReviews: false,
      canModifyAdminFields: false
    },
    guest: {
      canCreateReviews: false,
      canEditReviews: false,
      canDeleteReviews: false,
      canApproveReviews: false,
      canOverrideReviews: false,
      canViewAllReviews: false,
      canModifyAdminFields: false
    }
  },
  
  // Special permissions for review resources
  reviewResourcePermissions: {
    // Only admins can modify review status
    statusModification: {
      allowedRoles: ['admin'],
      message: 'Only administrators can modify review status'
    },
    
    // Admin-only reviews require admin approval
    adminOnlyApproval: {
      allowedRoles: ['admin'],
      message: 'Admin-only reviews require admin approval'
    },
    
    // Cannot delete reviews without admin permissions
    reviewDeletion: {
      allowedRoles: ['admin'],
      message: 'Only administrators can delete reviews'
    },
    
    // Cannot modify admin fields without admin permissions
    adminFieldsModification: {
      allowedRoles: ['admin'],
      message: 'Admin-only fields cannot be modified without admin permissions'
    }
  }
};

/**
 * dotCMS Workflow Configuration
 */
export const dotCMSWorkflow = {
  // Review workflow states
  states: {
    pending: {
      name: 'Pending',
      description: 'Review is pending and waiting for reviewers',
      allowedTransitions: ['in_review', 'cancelled'],
      requiredRole: 'user'
    },
    in_review: {
      name: 'In Review',
      description: 'Review is currently being reviewed',
      allowedTransitions: ['approved', 'rejected', 'needs_changes'],
      requiredRole: 'reviewer'
    },
    approved: {
      name: 'Approved',
      description: 'Review has been approved by all reviewers',
      allowedTransitions: ['pending_admin_approval', 'published'],
      requiredRole: 'reviewer'
    },
    rejected: {
      name: 'Rejected',
      description: 'Review has been rejected',
      allowedTransitions: ['pending'],
      requiredRole: 'reviewer'
    },
    needs_changes: {
      name: 'Needs Changes',
      description: 'Review needs changes before approval',
      allowedTransitions: ['pending', 'in_review'],
      requiredRole: 'reviewer'
    },
    pending_admin_approval: {
      name: 'Pending Admin Approval',
      description: 'Review is pending admin approval',
      allowedTransitions: ['approved', 'rejected'],
      requiredRole: 'admin'
    },
    published: {
      name: 'Published',
      description: 'Review has been published to production',
      allowedTransitions: [],
      requiredRole: 'admin'
    },
    cancelled: {
      name: 'Cancelled',
      description: 'Review has been cancelled',
      allowedTransitions: ['pending'],
      requiredRole: 'admin'
    }
  },
  
  // Workflow actions
  actions: {
    submitForReview: {
      name: 'Submit for Review',
      description: 'Submit content for review',
      fromStates: ['draft'],
      toState: 'pending',
      requiredRole: 'user'
    },
    startReview: {
      name: 'Start Review',
      description: 'Begin reviewing content',
      fromStates: ['pending'],
      toState: 'in_review',
      requiredRole: 'reviewer'
    },
    approveReview: {
      name: 'Approve Review',
      description: 'Approve the review',
      fromStates: ['in_review'],
      toState: 'approved',
      requiredRole: 'reviewer'
    },
    rejectReview: {
      name: 'Reject Review',
      description: 'Reject the review',
      fromStates: ['in_review', 'approved'],
      toState: 'rejected',
      requiredRole: 'reviewer'
    },
    requestChanges: {
      name: 'Request Changes',
      description: 'Request changes to the review',
      fromStates: ['in_review'],
      toState: 'needs_changes',
      requiredRole: 'reviewer'
    },
    adminApprove: {
      name: 'Admin Approve',
      description: 'Admin approval for the review',
      fromStates: ['pending_admin_approval'],
      toState: 'approved',
      requiredRole: 'admin'
    },
    publish: {
      name: 'Publish',
      description: 'Publish the approved review',
      fromStates: ['approved'],
      toState: 'published',
      requiredRole: 'admin'
    },
    cancel: {
      name: 'Cancel',
      description: 'Cancel the review',
      fromStates: ['pending', 'in_review'],
      toState: 'cancelled',
      requiredRole: 'admin'
    }
  }
};

/**
 * dotCMS Notification Configuration
 */
export const dotCMSNotifications = {
  // Notification types
  types: {
    reviewCreated: {
      name: 'Review Created',
      description: 'Notification when a new review is created',
      template: 'A new review "{reviewName}" has been created by {createdBy}',
      recipients: ['reviewers', 'admins']
    },
    reviewAssigned: {
      name: 'Review Assigned',
      description: 'Notification when a review is assigned to a reviewer',
      template: 'You have been assigned to review "{reviewName}"',
      recipients: ['assigned_reviewer']
    },
    reviewSubmitted: {
      name: 'Review Submitted',
      description: 'Notification when a review is submitted',
      template: 'Review "{reviewName}" has been submitted by {reviewer}',
      recipients: ['reviewers', 'admins']
    },
    reviewApproved: {
      name: 'Review Approved',
      description: 'Notification when a review is approved',
      template: 'Review "{reviewName}" has been approved by {reviewer}',
      recipients: ['reviewers', 'admins', 'creator']
    },
    reviewRejected: {
      name: 'Review Rejected',
      description: 'Notification when a review is rejected',
      template: 'Review "{reviewName}" has been rejected by {reviewer}',
      recipients: ['reviewers', 'admins', 'creator']
    },
    adminApprovalRequired: {
      name: 'Admin Approval Required',
      description: 'Notification when admin approval is required',
      template: 'Admin approval required for review "{reviewName}"',
      recipients: ['admins']
    },
    reviewPublished: {
      name: 'Review Published',
      description: 'Notification when a review is published',
      template: 'Review "{reviewName}" has been published to production',
      recipients: ['reviewers', 'admins', 'creator']
    }
  },
  
  // Notification channels
  channels: {
    email: {
      enabled: true,
      template: 'email-template.html'
    },
    inApp: {
      enabled: true,
      template: 'in-app-notification.html'
    },
    slack: {
      enabled: false,
      webhook: 'https://hooks.slack.com/services/...'
    }
  }
};

/**
 * Export all configurations
 */
export default {
  resources: dotCMSReviewResources,
  permissions: dotCMSPermissions,
  workflow: dotCMSWorkflow,
  notifications: dotCMSNotifications
}; 