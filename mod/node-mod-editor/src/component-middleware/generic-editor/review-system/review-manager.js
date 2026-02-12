/**
 * Review Manager for dotCMS
 * 
 * Handles review workflows, diff comparisons, and admin permissions
 * to prevent publishing mistakes and ensure proper review processes.
 */

export class ReviewManager {
  constructor() {
    this.reviews = new Map();
    this.reviewHistory = new Map();
    this.adminUsers = new Set();
    this.reviewResources = new Map();
    this.reviewSettings = {
      reviewLimit: 2, // Default review limit - configurable by admin
      requireAdminApproval: true,
      autoIncrementMajor: false
    };
  }

  /**
   * Initialize admin users (development only)
   */
  initializeAdminUsers() {
    // Development admin users - should be restricted in production
    this.adminUsers.add('johnholland');
    this.adminUsers.add('admin');
    this.adminUsers.add('developer');
    
    console.log('Review Manager: Admin users initialized');
  }

  /**
   * Check if user has admin permissions
   */
  hasAdminPermissions(userId) {
    return this.adminUsers.has(userId);
  }

  /**
   * Check if user has review permissions
   */
  hasReviewPermissions(userId, reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return false;
    
    // Admin users always have review permissions
    if (this.hasAdminPermissions(userId)) return true;
    
    // Check if user is assigned as reviewer
    return review.reviewers.includes(userId);
  }

  /**
   * Create a new review
   */
  createReview(reviewData) {
    const reviewId = `review-${Date.now()}`;
    
    const review = {
      id: reviewId,
      name: reviewData.name,
      description: reviewData.description,
      resources: reviewData.resources || [],
      reviewers: reviewData.reviewers || [],
      status: 'pending', // pending, in_review, approved, rejected
      createdAt: new Date().toISOString(),
      createdBy: reviewData.createdBy,
      originalContent: reviewData.originalContent,
      modifiedContent: reviewData.modifiedContent,
      diffData: null,
      reviewHistory: [],
      adminOnly: reviewData.adminOnly || false,
      requiresAdminApproval: reviewData.requiresAdminApproval || false
    };

    // Generate diff data
    review.diffData = this.generateDiffData(review.originalContent, review.modifiedContent);
    
    this.reviews.set(reviewId, review);
    this.reviewHistory.set(reviewId, []);
    
    // Create dotCMS resource for tracking
    this.createReviewResource(review);
    
    return review;
  }

  /**
   * Generate diff data for review
   */
  generateDiffData(original, modified) {
    // Simple diff implementation - in production, use a proper diff library
    const diff = {
      additions: [],
      deletions: [],
      modifications: []
    };

    if (typeof original === 'string' && typeof modified === 'string') {
      const originalLines = original.split('\n');
      const modifiedLines = modified.split('\n');
      
      for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
        const originalLine = originalLines[i] || '';
        const modifiedLine = modifiedLines[i] || '';
        
        if (originalLine !== modifiedLine) {
          if (originalLine && !modifiedLine) {
            diff.deletions.push({ line: i + 1, content: originalLine });
          } else if (!originalLine && modifiedLine) {
            diff.additions.push({ line: i + 1, content: modifiedLine });
          } else {
            diff.modifications.push({ 
              line: i + 1, 
              original: originalLine, 
              modified: modifiedLine 
            });
          }
        }
      }
    }

    return diff;
  }

  /**
   * Create dotCMS resource for review tracking
   */
  createReviewResource(review) {
    const resourceData = {
      id: review.id,
      type: 'review-resource',
      name: review.name,
      description: review.description,
      status: review.status,
      createdAt: review.createdAt,
      createdBy: review.createdBy,
      adminOnly: review.adminOnly,
      requiresAdminApproval: review.requiresAdminApproval,
      reviewers: review.reviewers,
      reviewHistory: review.reviewHistory,
      diffData: review.diffData,
      // dotCMS specific fields
      dotCMSResource: {
        contentType: 'ReviewResource',
        folder: '/reviews',
        permissions: {
          admin: ['read', 'write', 'delete'],
          reviewer: ['read', 'write'],
          user: ['read']
        }
      }
    };

    this.reviewResources.set(review.id, resourceData);
    
    // In production, this would create the actual dotCMS resource
    console.log(`Review Manager: Created dotCMS resource for review ${review.id}`);
    
    return resourceData;
  }

  /**
   * Submit a review
   */
  submitReview(reviewId, userId, reviewData) {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (!this.hasReviewPermissions(userId, reviewId)) {
      throw new Error('User does not have review permissions');
    }

    const reviewSubmission = {
      id: `submission-${Date.now()}`,
      reviewId: reviewId,
      reviewerId: userId,
      status: reviewData.status, // approved, rejected, needs_changes
      comments: reviewData.comments || '',
      timestamp: new Date().toISOString(),
      diffApproved: reviewData.diffApproved || false,
      adminOverride: reviewData.adminOverride || false
    };

    // Add to review history
    review.reviewHistory.push(reviewSubmission);
    this.reviewHistory.get(reviewId).push(reviewSubmission);

    // Update review status based on submissions
    this.updateReviewStatus(reviewId);

    // Update dotCMS resource
    this.updateReviewResource(reviewId);

    return reviewSubmission;
  }

  /**
   * Update review status based on submissions
   */
  updateReviewStatus(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return;

    const submissions = review.reviewHistory;
    const totalReviewers = review.reviewers.length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

    if (rejectedCount > 0) {
      review.status = 'rejected';
    } else if (approvedCount >= totalReviewers) {
      if (review.requiresAdminApproval) {
        review.status = 'pending_admin_approval';
      } else {
        review.status = 'approved';
      }
    } else {
      review.status = 'in_review';
    }
  }

  /**
   * Admin approval for review
   */
  adminApproveReview(reviewId, adminUserId) {
    if (!this.hasAdminPermissions(adminUserId)) {
      throw new Error('User does not have admin permissions');
    }

    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.status = 'approved';
    review.adminApprovedBy = adminUserId;
    review.adminApprovedAt = new Date().toISOString();

    // Update dotCMS resource
    this.updateReviewResource(reviewId);

    return review;
  }

  /**
   * Decline review - prevents publish
   */
  declineReview(reviewId, userId, comment = '') {
    if (!this.hasReviewPermissions(userId, reviewId)) {
      throw new Error('Review permissions required');
    }

    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.status = 'rejected';
    review.declinedBy = userId;
    review.declinedAt = new Date().toISOString();
    review.declineComment = comment;
    review.canPublish = false; // Prevents publish
    
    // Add to review history
    this.addReviewHistory(reviewId, {
      action: 'declined',
      userId: userId,
      timestamp: new Date().toISOString(),
      comment: comment || 'Review declined'
    });

    // Update dotCMS resource
    this.updateReviewResource(reviewId);
    
    return review;
  }

  /**
   * Suggest changes - loads editor for editing
   */
  suggestChanges(reviewId, userId, suggestions = '') {
    if (!this.hasReviewPermissions(userId, reviewId)) {
      throw new Error('Review permissions required');
    }

    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    review.status = 'suggestions_provided';
    review.suggestionsBy = userId;
    review.suggestionsAt = new Date().toISOString();
    review.suggestions = suggestions;
    
    // Add to review history
    this.addReviewHistory(reviewId, {
      action: 'suggestions_provided',
      userId: userId,
      timestamp: new Date().toISOString(),
      comment: suggestions || 'Changes suggested'
    });

    // Update dotCMS resource
    this.updateReviewResource(reviewId);
    
    return review;
  }

  /**
   * Approve review - adds approval
   */
  approveReview(reviewId, userId, comment = '') {
    if (!this.hasReviewPermissions(userId, reviewId)) {
      throw new Error('Review permissions required');
    }

    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Add approval to review
    if (!review.approvals) {
      review.approvals = [];
    }
    
    // Check if user already approved
    const existingApproval = review.approvals.find(a => a.userId === userId);
    if (existingApproval) {
      throw new Error('User has already approved this review');
    }

    review.approvals.push({
      userId: userId,
      approvedAt: new Date().toISOString(),
      comment: comment || 'Approved'
    });

    // Check if review limit is reached
    if (review.approvals.length >= this.reviewSettings.reviewLimit) {
      review.status = 'approved';
      review.canPublish = true;
    }
    
    // Add to review history
    this.addReviewHistory(reviewId, {
      action: 'approved',
      userId: userId,
      timestamp: new Date().toISOString(),
      comment: comment || 'Review approved'
    });

    // Update dotCMS resource
    this.updateReviewResource(reviewId);
    
    return review;
  }

  /**
   * Check if component can be published
   */
  canPublishComponent(componentId, version) {
    const reviews = Array.from(this.reviews.values())
      .filter(r => r.resources.some(res => res.componentId === componentId && res.version === version));
    
    // Check if any review is declined
    const hasDeclinedReview = reviews.some(r => r.status === 'rejected');
    if (hasDeclinedReview) {
      return false;
    }

    // Check if review limit is reached
    const approvedReviews = reviews.filter(r => r.status === 'approved');
    const totalApprovals = approvedReviews.reduce((sum, r) => sum + (r.approvals?.length || 0), 0);
    
    return totalApprovals >= this.reviewSettings.reviewLimit;
  }

  /**
   * Get version increment type for component
   */
  getVersionIncrementType(componentId, version, incrementMajor = false) {
    const canPublish = this.canPublishComponent(componentId, version);
    
    if (incrementMajor) {
      return 'major';
    } else if (canPublish) {
      return 'minor';
    } else {
      return 'revision';
    }
  }

  /**
   * Update review settings (admin only)
   */
  updateReviewSettings(adminUserId, settings) {
    if (!this.hasAdminPermissions(adminUserId)) {
      throw new Error('Admin permissions required');
    }

    this.reviewSettings = {
      ...this.reviewSettings,
      ...settings
    };

    console.log('Review settings updated:', this.reviewSettings);
    return this.reviewSettings;
  }

  /**
   * Get review settings
   */
  getReviewSettings() {
    return { ...this.reviewSettings };
  }

  /**
   * Add entry to review history
   */
  addReviewHistory(reviewId, entry) {
    const history = this.reviewHistory.get(reviewId) || [];
    history.push(entry);
    this.reviewHistory.set(reviewId, history);
    
    // Also update the review's history
    const review = this.reviews.get(reviewId);
    if (review) {
      if (!review.reviewHistory) {
        review.reviewHistory = [];
      }
      review.reviewHistory.push(entry);
    }
  }

  /**
   * Update dotCMS review resource
   */
  updateReviewResource(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return;

    const resource = this.reviewResources.get(reviewId);
    if (resource) {
      resource.status = review.status;
      resource.reviewHistory = review.reviewHistory;
      resource.adminApprovedBy = review.adminApprovedBy;
      resource.adminApprovedAt = review.adminApprovedAt;

      // In production, this would update the actual dotCMS resource
      console.log(`Review Manager: Updated dotCMS resource for review ${reviewId}`);
    }
  }

  /**
   * Get all reviews
   */
  getAllReviews() {
    return Array.from(this.reviews.values());
  }

  /**
   * Get review by ID
   */
  getReview(reviewId) {
    return this.reviews.get(reviewId);
  }

  /**
   * Get reviews by status
   */
  getReviewsByStatus(status) {
    return this.getAllReviews().filter(review => review.status === status);
  }

  /**
   * Get reviews requiring admin approval
   */
  getReviewsRequiringAdminApproval() {
    return this.getAllReviews().filter(review => 
      review.status === 'pending_admin_approval' && review.requiresAdminApproval
    );
  }

  /**
   * Get review history
   */
  getReviewHistory(reviewId) {
    return this.reviewHistory.get(reviewId) || [];
  }

  /**
   * Delete review (admin only)
   */
  deleteReview(reviewId, adminUserId) {
    if (!this.hasAdminPermissions(adminUserId)) {
      throw new Error('User does not have admin permissions');
    }

    const deleted = this.reviews.delete(reviewId);
    this.reviewHistory.delete(reviewId);
    this.reviewResources.delete(reviewId);

    return deleted;
  }

  /**
   * Export review data for dotCMS
   */
  exportReviewData(reviewId) {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    return {
      reviewId: review.id,
      name: review.name,
      description: review.description,
      status: review.status,
      createdAt: review.createdAt,
      createdBy: review.createdBy,
      reviewers: review.reviewers,
      reviewHistory: review.reviewHistory,
      diffData: review.diffData,
      adminOnly: review.adminOnly,
      requiresAdminApproval: review.requiresAdminApproval,
      dotCMSResource: this.reviewResources.get(reviewId)
    };
  }
}

/**
 * Create Review Manager instance
 */
export const createReviewManager = () => {
  const manager = new ReviewManager();
  manager.initializeAdminUsers();
  return manager;
};

/**
 * Review Page Component
 */
export const createReviewPage = (reviewManager) => {
  return {
    id: 'review-page',
    name: 'Review Page',
    description: 'Review page with diff modal and admin permissions',
    
    create: (config = {}) => {
      return createViewStateMachine({
        id: 'review-page-machine',
        initial: 'loading',
        context: {
          reviewManager,
          reviews: [],
          selectedReview: null,
          showDiffModal: false,
          currentUser: config.currentUser || 'user',
          ...config
        },
        states: {
          loading: {
            on: {
              REVIEWS_LOADED: 'ready'
            }
          },
          ready: {
            on: {
              SELECT_REVIEW: 'reviewing',
              CREATE_REVIEW: 'creating',
              ADMIN_APPROVE: 'ready'
            }
          },
          reviewing: {
            on: {
              SHOW_DIFF: 'showing_diff',
              SUBMIT_REVIEW: 'ready',
              BACK_TO_LIST: 'ready'
            }
          },
          showing_diff: {
            on: {
              CLOSE_DIFF: 'reviewing',
              APPROVE_DIFF: 'reviewing',
              REJECT_DIFF: 'reviewing'
            }
          },
          creating: {
            on: {
              REVIEW_CREATED: 'ready',
              CANCEL_CREATE: 'ready'
            }
          }
        }
      });
    }
  };
}; 