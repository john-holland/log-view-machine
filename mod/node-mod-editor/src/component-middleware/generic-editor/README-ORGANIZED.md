# Generic Editor - Organized Project Structure

This document outlines the organized structure of the generic-editor project, which serves as a comprehensive component editor with extensive testing and documentation.

## 📁 Project Structure

```
generic-editor/
├── 📚 docs/                          # Documentation and guides
│   ├── 📖 guides/                    # How-to guides and tutorials
│   ├── 🏗️ architecture/             # System architecture documentation
│   ├── ✨ features/                  # Feature documentation
│   └── 📋 summaries/                # Project summaries and reports
├── 🧪 tests/                         # Testing infrastructure
│   ├── 🎯 demos/                     # Demo and example tests
│   ├── 🔗 integration/               # Integration test scenarios
│   └── ⚡ features/                  # Feature-specific test cases
├── 🎨 templates/                     # Component templates
│   ├── burger-cart-component/        # Cart component with burger builder
│   ├── html-editor/                  # HTML editing capabilities
│   ├── css-editor/                   # CSS editing and management
│   ├── javascript-editor/            # JavaScript code editing
│   ├── xstate-editor/                # State machine visualization
│   ├── component-library/            # Drag-and-drop component library
│   └── generic-editor/               # Main editor template
├── 📁 data/                          # Data and persistence
├── 📄 index.html                     # Main editor interface
├── 🔧 index.js                       # Editor configuration and setup
├── 🎨 ui.js                          # UI flow and interactions
├── 🖥️ ui-demo.js                     # UI demonstration code
├── 🚀 server.js                      # Development server
├── 💾 persistence.js                 # Data persistence layer
├── 🐳 docker-compose.yml             # Docker configuration
├── 📋 package.json                   # Project dependencies
└── 🎯 cursor-coda.yaml              # Cursor development guidelines
```

## 🎯 Purpose of Each Directory

### 📚 `docs/` - Documentation Hub
- **`guides/`**: Step-by-step tutorials and how-to guides
- **`architecture/`**: System design and architecture documentation
- **`features/`**: Feature-specific documentation and guides
- **`summaries/`**: Project summaries and implementation reports

### 🧪 `tests/` - Testing Infrastructure
- **`demos/`**: Working examples and demonstration tests
- **`integration/`**: Integration test scenarios and workflows
- **`features/`**: Feature-specific test cases and validation

### 🎨 `templates/` - Component Templates
- **`burger-cart-component/`**: E-commerce cart with ingredient builder
- **`html-editor/`**: Rich text HTML editing
- **`css-editor/`**: CSS styling and management
- **`javascript-editor/`**: JavaScript code editing
- **`xstate-editor/`**: State machine visualization and editing
- **`component-library/`**: Component library and management
- **`generic-editor/`**: Main editor template and configuration

## 🚀 Key Features and Components

### 1. **Main Editor Interface**
- **Location**: `index.html`
- **Purpose**: Primary editor interface with multiple tabs
- **Features**: HTML, CSS, JavaScript, XState, and Cart editing

### 2. **Cart Component System**
- **Location**: `templates/burger-cart-component/`
- **Purpose**: Interactive shopping cart with burger builder
- **Features**: 
  - Ingredient management
  - Cart operations
  - Checkout flow
  - Time-sensitive items
  - Local storage persistence

### 3. **Component Library**
- **Location**: `templates/component-library/`
- **Purpose**: Drag-and-drop component management
- **Features**:
  - Component search and filtering
  - Category organization
  - Drag-and-drop functionality
  - Component preview and selection

### 4. **Editor Templates**
- **HTML Editor**: Rich text editing with SunEditor
- **CSS Editor**: Code editing with syntax highlighting
- **JavaScript Editor**: Advanced code editing with Ace
- **XState Editor**: State machine visualization and editing

## 📖 Documentation Index

### Guides (`docs/guides/`)
- Editor usage tutorials
- Component development guides
- Integration examples

### Architecture (`docs/architecture/`)
- System design documentation
- Component architecture
- State management patterns

### Features (`docs/features/`)
- Feature implementation guides
- Advanced capabilities
- Performance optimization

### Summaries (`docs/summaries/`)
- Project implementation summaries
- Feature completion reports
- Technical analysis documents

## 🧪 Testing Infrastructure

### Demo Tests (`tests/demos/`)
- **Purpose**: Working examples and demonstrations
- **Content**: HTML demo files, JavaScript examples
- **Usage**: Learning and reference

### Integration Tests (`tests/integration/`)
- **Purpose**: End-to-end integration scenarios
- **Content**: Fish burger integration, editor pact integration
- **Usage**: Testing component interactions

### Feature Tests (`tests/features/`)
- **Purpose**: Feature-specific test cases
- **Content**: Tab switching, save functionality, drag-and-drop
- **Usage**: Feature validation and regression testing

## 🔧 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   node server.js
   ```

3. **Open in Browser**
   ```
   http://localhost:3000
   ```

4. **Run Tests**
   ```bash
   # Run specific test files
   node test-simple.js
   node test-coverage-audit.js
   ```

## 📚 Learning Path

### For Beginners
1. Start with `index.html` to see the main interface
2. Explore `tests/demos/` for working examples
3. Review `docs/guides/` for tutorials

### For Developers
1. Study `templates/` for component patterns
2. Review `docs/architecture/` for system design
3. Explore `tests/features/` for implementation details

### For Integration
1. Check `tests/integration/` for workflow examples
2. Review `docs/features/` for advanced capabilities
3. Study `persistence.js` for data management

## 🎨 Component Templates Deep Dive

### Burger Cart Component
- **File**: `templates/burger-cart-component/index.js`
- **Features**: 
  - State machine-based cart management
  - Ingredient builder with real-time updates
  - Checkout flow with multiple steps
  - Time-sensitive item handling
  - Local storage persistence

### Component Library
- **File**: `templates/component-library/index.js`
- **Features**:
  - Component categorization and tagging
  - Search and filtering capabilities
  - Drag-and-drop functionality
  - Component preview and selection

### Generic Editor Template
- **File**: `templates/generic-editor/index.js`
- **Features**:
  - Multi-tab editing interface
  - Component property management
  - Developer mode tools
  - Auto-save functionality

## 🔍 Finding What You Need

### Looking for Examples?
- Check `tests/demos/` for working examples
- Review `templates/` for component patterns

### Need Configuration?
- Look in `docs/configs/` for service configurations
- Check `docker-compose.yml` for environment setup

### Want to Learn?
- Start with `docs/guides/` for tutorials
- Review `docs/summaries/` for project overview

### Building Components?
- Explore `templates/` for component patterns
- Check `tests/features/` for feature implementations

## 🎯 Testing Strategy

### Demo Tests
- **Purpose**: Showcase functionality
- **Audience**: Users and stakeholders
- **Content**: Working examples and use cases

### Integration Tests
- **Purpose**: Validate component interactions
- **Audience**: Developers and QA
- **Content**: End-to-end workflows

### Feature Tests
- **Purpose**: Validate specific features
- **Audience**: Developers
- **Content**: Unit and integration test cases

## 📝 Contributing

When adding new content:
1. **Documentation**: Place in appropriate `docs/` subdirectory
2. **Tests**: Organize in relevant `tests/` subdirectory
3. **Templates**: Add to `templates/` directory
4. **Examples**: Include in `tests/demos/`

## 🎯 Future Enhancements

- [ ] Add more component templates
- [ ] Expand testing coverage
- [ ] Create interactive tutorials
- [ ] Add performance benchmarks
- [ ] Include more integration examples
- [ ] Enhanced drag-and-drop capabilities
- [ ] Component versioning system
- [ ] Real-time collaboration features

## 🔧 Development Tools

### Cursor Integration
- **File**: `cursor-coda.yaml`
- **Purpose**: Development guidelines and best practices
- **Usage**: AI-assisted development with Cursor

### State Management
- **File**: `state-test-mapping.js`
- **Purpose**: State machine testing and validation
- **Usage**: Debugging and testing state transitions

### Persistence Layer
- **File**: `persistence.js`
- **Purpose**: Data persistence and management
- **Usage**: Saving and loading component data

---

This organized structure makes it easy to find specific information, examples, and implementations while maintaining a clear separation of concerns. Each directory serves a specific purpose and contains related content for easy discovery and reference.
