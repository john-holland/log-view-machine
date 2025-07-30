# Git Commit and dotCMS Persistence Features

## Overview

The Generic Editor now includes advanced git commit functionality and dotCMS persistence replication. These features provide secure version control and proper content management system integration.

## 🔧 Git Commit Functionality

### Security Requirements
- **Developer Mode**: Must be enabled to access git commit features
- **Include in Editor Src**: Checkbox must be checked to allow commits
- **Component Loaded**: A component must be loaded to perform commits

### UI Controls

#### Developer Mode Toggle
```html
<label class="developer-checkbox">
    <input type="checkbox" id="developer-mode" onchange="toggleDeveloperMode()">
    Developer Mode
</label>
```

#### Include in Editor Src Checkbox
```html
<label class="editor-src-checkbox" id="editor-src-checkbox" style="display: none;">
    <input type="checkbox" id="include-in-editor-src">
    Include in Editor Src
</label>
```

#### Git Commit Button
```html
<button class="btn btn-warning" id="git-commit-btn" onclick="performGitCommit()" style="display: none;">
    🔧 Git Commit
</button>
```

### JavaScript Functions

#### `toggleDeveloperMode()`
```javascript
function toggleDeveloperMode() {
    const developerMode = document.getElementById('developer-mode').checked;
    const editorSrcCheckbox = document.getElementById('editor-src-checkbox');
    const gitCommitBtn = document.getElementById('git-commit-btn');
    
    if (developerMode) {
        editorSrcCheckbox.style.display = 'flex';
        console.log('🔧 Developer mode enabled');
    } else {
        editorSrcCheckbox.style.display = 'none';
        gitCommitBtn.style.display = 'none';
        document.getElementById('include-in-editor-src').checked = false;
        console.log('🔧 Developer mode disabled');
    }
}
```

#### `checkGitCommitVisibility()`
```javascript
function checkGitCommitVisibility() {
    const developerMode = document.getElementById('developer-mode').checked;
    const includeInEditorSrc = document.getElementById('include-in-editor-src').checked;
    const gitCommitBtn = document.getElementById('git-commit-btn');
    
    if (developerMode && includeInEditorSrc && currentComponent) {
        gitCommitBtn.style.display = 'inline-block';
    } else {
        gitCommitBtn.style.display = 'none';
    }
}
```

#### `performGitCommit()`
```javascript
async function performGitCommit() {
    // Validates developer mode and include in editor src
    // Prompts for commit message
    // Performs git add and commit
    // Returns commit hash and details
}
```

### Server Endpoint

#### `POST /api/components/:id/commit`
```javascript
// Request body
{
    includeInEditorSrc: boolean,
    commitMessage: string,
    developerMode: boolean
}

// Response
{
    success: boolean,
    message: string,
    commitHash: string,
    commitMessage: string,
    componentId: string
}
```

### Git Commit Process
1. **Validation**: Checks developer mode and include in editor src
2. **Git Status**: Checks for uncommitted changes
3. **Git Add**: Adds all changes to staging
4. **Git Commit**: Creates commit with provided message
5. **Return**: Returns commit hash and details

## 💾 dotCMS Persistence Replication

### Purpose
Replicates dotCMS content management system structure locally for development and testing.

### Server Endpoint

#### `POST /api/components/:id/persist`
```javascript
// Request body: Component data
{
    id: string,
    name: string,
    description: string,
    template: string,
    styles: string,
    script: string,
    stateMachine: object,
    version: string,
    // ... other component properties
}

// Response
{
    success: boolean,
    message: string,
    componentId: string,
    resourcePath: string,
    versionHistoryPath: string,
    workflowHistoryPath: string,
    dotCMSResource: object
}
```

### dotCMS Resource Structure

#### Main Resource
```javascript
{
    id: 'component-id',
    name: 'Component Name',
    description: 'Component description',
    type: 'component',
    version: '1.0.0',
    template: 'HTML template',
    styles: 'CSS styles',
    script: 'JavaScript code',
    stateMachine: { /* XState machine */ },
    metadata: {
        createdBy: 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-01T00:00:00.000Z',
        lastModifiedBy: 'user',
        status: 'active',
        publishStatus: 'draft',
        workflowState: 'draft',
        tags: [],
        categories: []
    },
    permissions: {
        read: ['anonymous', 'authenticated'],
        write: ['admin', 'developer'],
        publish: ['admin'],
        delete: ['admin']
    },
    workflow: {
        currentState: 'draft',
        availableTransitions: ['submit_for_review', 'publish'],
        history: []
    },
    review: {
        status: 'not_submitted',
        reviewers: [],
        requiredApprovals: 2,
        approvals: [],
        comments: []
    }
}
```

#### Version History
```javascript
{
    componentId: 'component-id',
    versions: [
        {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            changes: 'Initial version',
            author: 'user',
            status: 'active'
        }
    ]
}
```

#### Workflow History
```javascript
{
    componentId: 'component-id',
    workflowHistory: [
        {
            action: 'created',
            timestamp: '2024-01-01T00:00:00.000Z',
            user: 'user',
            state: 'draft',
            comment: 'Component created'
        }
    ]
}
```

### File Structure
```
data/
└── dotcms-replication/
    ├── component-id.json              # Main resource
    ├── component-id-versions.json     # Version history
    └── component-id-workflow.json     # Workflow history
```

## 🔐 Security Features

### Developer Mode Protection
- Git commit only available when developer mode is enabled
- UI controls hidden when developer mode is disabled
- Server-side validation of developer mode status

### Include in Editor Src Protection
- Additional checkbox required for git commits
- Prevents accidental commits to source control
- Clear visual indication of commit requirements

### Permission System
- Read permissions for anonymous and authenticated users
- Write permissions for admin and developer users
- Publish permissions for admin users only
- Delete permissions for admin users only

## 🎨 UI Features

### Visual Indicators
- **Developer Mode**: Red text with warning icon
- **Include in Editor Src**: Yellow text with caution icon
- **Git Commit Button**: Warning color with tool icon

### Responsive Design
- Controls adapt to developer mode state
- Buttons show/hide based on conditions
- Clear visual feedback for all states

### Error Handling
- Comprehensive error messages
- User-friendly prompts
- Graceful failure handling

## 🧪 Testing

### Test Script
Run `test-git-persistence.js` to verify functionality:
```bash
node test-git-persistence.js
```

### Test Scenarios
1. **Component Creation**: Test component creation
2. **dotCMS Persistence**: Test persistence replication
3. **Git Commit Security**: Test commit rejection without proper conditions
4. **Git Commit Success**: Test successful commit with proper conditions
5. **Error Handling**: Test error scenarios
6. **Server Persistence**: Test server-side functionality

## 📋 Usage Examples

### Basic Git Commit Workflow
1. **Enable Developer Mode**: Check the developer mode checkbox
2. **Check Include in Editor Src**: Check the include checkbox
3. **Load Component**: Load a component to edit
4. **Make Changes**: Edit the component content
5. **Commit Changes**: Click the git commit button
6. **Enter Message**: Provide optional commit message
7. **Verify**: Check git log for commit

### dotCMS Persistence Workflow
1. **Create Component**: Create or load a component
2. **Call Persist Endpoint**: Use the persist API endpoint
3. **Verify Files**: Check the data/dotcms-replication directory
4. **Review Structure**: Examine the created resource files

### Security Workflow
1. **Disable Developer Mode**: Uncheck developer mode
2. **Verify UI**: Git commit button should be hidden
3. **Test API**: Server should reject commit requests
4. **Enable Developer Mode**: Re-enable to restore functionality

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development  # Enables developer features
PORT=3000            # Server port
```

### Server Configuration
```javascript
// Git commit configuration
const gitConfig = {
    requireDeveloperMode: true,
    requireIncludeInEditorSrc: true,
    allowEmptyCommits: false,
    defaultCommitMessage: 'Component update'
};

// dotCMS persistence configuration
const dotCMSConfig = {
    replicationDir: './data/dotcms-replication',
    createVersionHistory: true,
    createWorkflowHistory: true,
    defaultPermissions: {
        read: ['anonymous', 'authenticated'],
        write: ['admin', 'developer'],
        publish: ['admin'],
        delete: ['admin']
    }
};
```

## 🚀 Integration

### With Review System
- Git commits can be tied to review approvals
- dotCMS persistence includes review workflow
- Version history tracks review states

### With Component Management
- Git commits update component versions
- dotCMS persistence maintains component relationships
- Workflow history tracks component lifecycle

### With dotCMS
- Persistence structure matches dotCMS API
- Resource format compatible with dotCMS
- Permission system mirrors dotCMS roles

## 📊 Monitoring

### Git Commit Metrics
- Commit frequency
- Success/failure rates
- Developer mode usage
- Include in editor src usage

### Persistence Metrics
- Resource creation rate
- File size statistics
- Version history depth
- Workflow state distribution

### Error Tracking
- Git command failures
- File system errors
- Permission violations
- Validation failures 