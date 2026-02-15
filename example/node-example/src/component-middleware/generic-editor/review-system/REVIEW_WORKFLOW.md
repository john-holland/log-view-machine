# Review Workflow System

## Overview

The Review Workflow System provides a comprehensive review process for dotCMS components with three main actions: **Decline**, **Suggest Changes**, and **Approve**. The system includes configurable review limits, version management, and admin controls to prevent publishing mistakes.

## Core Workflow Actions

### 1. Decline Review
- **Purpose**: Prevents component from being published
- **Action**: Sets review status to 'rejected' and `canPublish = false`
- **Logged**: In dotCMS with decline reason and timestamp
- **Effect**: Component cannot be published until review is resolved

### 2. Suggest Changes
- **Purpose**: Provides feedback and loads component for editing
- **Action**: Sets status to 'suggestions_provided' and loads editor
- **Logged**: In dotCMS with suggestions and timestamp
- **Effect**: Component is loaded in editor for modifications

### 3. Approve Review
- **Purpose**: Adds approval to review
- **Action**: Increments approval count, checks review limit
- **Logged**: In dotCMS with approval comment and timestamp
- **Effect**: When review limit is reached, component can be published

## Review Limit System

### Configurable Review Limit
- **Default**: 2 approvals required
- **Admin Configurable**: Can be changed by admin users
- **Effect**: Controls how many approvals needed before publish

### Version Management
- **Revision**: When review limit not met (default)
- **Minor**: When review limit is met
- **Major**: When checkbox is selected for major increment

## Admin Controls

### Review Settings
```javascript
reviewSettings = {
  reviewLimit: 2,           // Number of approvals required
  requireAdminApproval: true, // Whether admin approval is required
  autoIncrementMajor: false  // Auto-increment major version
}
```

### Admin Functions
- Update review limit
- Configure approval requirements
- Manage review settings
- Override review decisions

## Version Increment Logic

### Component Publish Status
```javascript
function getVersionIncrementType(componentId, version, incrementMajor) {
  const canPublish = canPublishComponent(componentId, version);
  
  if (incrementMajor) {
    return 'major';
  } else if (canPublish) {
    return 'minor';
  } else {
    return 'revision';
  }
}
```

### Version Rules
- **Major**: When "Increment Major revision" checkbox is selected
- **Minor**: When review limit is reached and component can be published
- **Revision**: When review limit not met or component cannot be published

## UI Components

### Review Modal
```html
<div class="diff-modal-footer">
  <div class="review-options">
    <label class="major-version-checkbox">
      <input type="checkbox" id="increment-major-version">
      Increment Major revision if approved and published
    </label>
  </div>
  <div class="review-actions">
    <button class="diff-modal-btn" onclick="closeDiffModal()">Close</button>
    <button class="diff-modal-btn decline" onclick="declineReview()">Decline</button>
    <button class="diff-modal-btn suggest" onclick="suggestChanges()">Suggest Changes</button>
    <button class="diff-modal-btn approve" onclick="approveReview()">Approve</button>
  </div>
</div>
```

### Button States
- **Decline**: Red button, prevents publish
- **Suggest Changes**: Yellow button, loads editor
- **Approve**: Green button, adds approval
- **Major Version Checkbox**: Controls version increment type

## Review Manager API

### Core Methods

#### `declineReview(reviewId, userId, comment)`
```javascript
const declinedReview = reviewManager.declineReview(reviewId, userId, 'Reason for decline');
// Sets status to 'rejected', canPublish = false
```

#### `suggestChanges(reviewId, userId, suggestions)`
```javascript
const suggestedReview = reviewManager.suggestChanges(reviewId, userId, 'Add hover effects');
// Sets status to 'suggestions_provided', loads editor
```

#### `approveReview(reviewId, userId, comment)`
```javascript
const approvedReview = reviewManager.approveReview(reviewId, userId, 'Looks good');
// Adds approval, checks review limit
```

#### `canPublishComponent(componentId, version)`
```javascript
const canPublish = reviewManager.canPublishComponent(componentId, version);
// Returns boolean based on review status
```

#### `getVersionIncrementType(componentId, version, incrementMajor)`
```javascript
const incrementType = reviewManager.getVersionIncrementType(componentId, version, true);
// Returns 'major', 'minor', or 'revision'
```

### Settings Management

#### `updateReviewSettings(adminUserId, settings)`
```javascript
const settings = reviewManager.updateReviewSettings(adminUser, {
  reviewLimit: 3,
  requireAdminApproval: true,
  autoIncrementMajor: false
});
```

#### `getReviewSettings()`
```javascript
const settings = reviewManager.getReviewSettings();
// Returns current review settings
```

## Review History

### History Entries
Each review action creates a history entry:
```javascript
{
  action: 'declined' | 'suggestions_provided' | 'approved',
  userId: 'user_id',
  timestamp: '2024-01-01T00:00:00.000Z',
  comment: 'Action comment'
}
```

### History Tracking
- All actions are logged in dotCMS
- History is preserved across sessions
- Admin can view full review history
- History includes timestamps and user information

## Integration with dotCMS

### Resource Management
```javascript
// Review resources in dotCMS
{
  reviewId: 'review-123',
  componentId: 'button-component',
  version: '1.0.0',
  status: 'pending',
  reviewHistory: [...],
  canPublish: false
}
```

### Permissions
- **Admin Users**: Can update settings, override decisions
- **Reviewers**: Can decline, suggest changes, approve
- **Regular Users**: Can view reviews, cannot modify

## Usage Examples

### Basic Review Workflow
1. **Create Review**: Component changes submitted for review
2. **Review Actions**: Reviewers can decline, suggest changes, or approve
3. **Review Limit**: System tracks approvals until limit is reached
4. **Publish Decision**: Component can be published when limit met

### Admin Configuration
1. **Access Settings**: Admin clicks "⚙️ Review Settings"
2. **Update Limit**: Change number of required approvals
3. **Save Changes**: Settings updated in dotCMS
4. **Apply to Reviews**: New settings apply to future reviews

### Version Management
1. **Check Publish Status**: System determines if component can be published
2. **Select Version Type**: Choose major, minor, or revision increment
3. **Apply Changes**: Version incremented based on review status

## Error Handling

### Common Errors
- **Permission Denied**: User lacks review permissions
- **Already Approved**: User has already approved this review
- **Review Not Found**: Invalid review ID
- **Admin Required**: Action requires admin permissions

### Error Responses
```javascript
try {
  const result = reviewManager.approveReview(reviewId, userId, comment);
} catch (error) {
  console.error('Review action failed:', error.message);
  alert('Failed to process review action: ' + error.message);
}
```

## Testing

### Demo Script
Run `demo-workflow.js` to test all workflow features:
```bash
node demo-workflow.js
```

### Test Scenarios
1. **Decline Review**: Test decline functionality
2. **Suggest Changes**: Test suggestion workflow
3. **Approve Reviews**: Test approval counting
4. **Version Management**: Test version increment logic
5. **Admin Settings**: Test settings configuration
6. **Review History**: Test history tracking
7. **Publish Status**: Test component publish scenarios

## Security Considerations

### Permission Validation
- All actions validate user permissions
- Admin actions require admin privileges
- Review actions require reviewer permissions

### Data Integrity
- Review history is immutable
- Settings changes are logged
- Version increments are validated

### dotCMS Integration
- Review data stored in dotCMS resources
- Permissions managed through dotCMS
- History preserved in dotCMS database 