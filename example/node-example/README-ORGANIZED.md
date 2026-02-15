# Node Example - Organized Project Structure

This document outlines the organized structure of the node-example project, which serves as a comprehensive lookbook and testing ground for various features and integrations.

## 📁 Project Structure

```
node-example/
├── 📚 docs/                          # Documentation and guides
│   ├── 📖 guides/                    # How-to guides and tutorials
│   │   └── LOGGING_WAREHOUSING_GUIDE.md
│   ├── 🔧 configs/                   # Configuration files
│   │   ├── otel-collector-config.yaml
│   │   └── fluentd.conf
│   ├── 📋 summaries/                 # Project summaries and reports
│   │   ├── COMPLETE_ORDER_SUBMACHINE_SUMMARY.md
│   │   ├── WITH_SERVER_STATE_SUMMARY.md
│   │   ├── TOME_SSR_SUMMARY.md
│   │   └── TRACING_SUMMARY.md
│   └── 📝 examples/                  # Code examples and samples
├── 🧪 tests/                         # Test files and test results
│   ├── e2e/                         # End-to-end tests
│   └── test-results/                # Test execution results
├── 🎭 playwright-report/             # Playwright test reports
├── 📦 src/                          # Source code
│   ├── component-middleware/         # Component system
│   │   └── generic-editor/          # Generic editor implementation
│   │       ├── 📚 docs/             # Editor documentation
│   │       │   ├── 📖 guides/       # Editor guides
│   │       │   ├── 🏗️ architecture/ # System architecture docs
│   │       │   ├── ✨ features/     # Feature documentation
│   │       │   └── 📋 summaries/    # Editor summaries
│   │       ├── 🧪 tests/            # Editor tests
│   │       │   ├── 🎯 demos/        # Demo and example tests
│   │       │   ├── 🔗 integration/  # Integration tests
│   │       │   └── ⚡ features/     # Feature-specific tests
│   │       ├── 🎨 templates/        # Component templates
│   │       └── 📁 data/             # Data and persistence
│   ├── CompleteOrderStateMachine.js # State machine implementation
│   └── tome-server.js               # Server implementation
├── 📊 logs/                         # Application logs
├── 🗄️ log-warehouse/                # Log storage and analysis
├── 🐳 docker-compose.yml            # Docker configuration
├── 📋 package.json                  # Project dependencies
└── 🎯 playwright.config.js          # Playwright configuration
```

## 🎯 Purpose of Each Directory

### 📚 `docs/` - Documentation Hub
- **`guides/`**: Step-by-step tutorials and how-to guides
- **`configs/`**: Configuration files for various services
- **`summaries/`**: Project summaries, feature reports, and analysis
- **`examples/`**: Code examples and sample implementations

### 🧪 `tests/` - Testing Infrastructure
- **`e2e/`**: End-to-end test scenarios
- **`test-results/`**: Generated test results and reports

### 📦 `src/` - Source Code
- **`component-middleware/`**: Component system implementation
  - **`generic-editor/`**: Full-featured editor system
    - **`docs/`**: Editor-specific documentation
    - **`tests/`**: Editor testing suite
    - **`templates/`**: Reusable component templates

## 🚀 Key Features and Components

### 1. **Complete Order State Machine**
- Location: `src/CompleteOrderStateMachine.js`
- Purpose: XState-based order processing with OpenTelemetry tracing
- Features: Validation, payment processing, error handling

### 2. **Generic Editor System**
- Location: `src/component-middleware/generic-editor/`
- Purpose: Comprehensive component editor with multiple tabs
- Features: HTML, CSS, JavaScript, XState, and Cart component editing

### 3. **Cart Component**
- Location: `src/component-middleware/generic-editor/templates/burger-cart-component/`
- Purpose: Interactive shopping cart with burger builder
- Features: Ingredient management, cart operations, checkout flow

### 4. **Component Library**
- Location: `src/component-middleware/generic-editor/templates/component-library/`
- Purpose: Drag-and-drop component library
- Features: Search, filtering, component selection

## 📖 Documentation Index

### Guides (`docs/guides/`)
- **LOGGING_WAREHOUSING_GUIDE.md**: Comprehensive logging and observability guide

### Configuration (`docs/configs/`)
- **otel-collector-config.yaml**: OpenTelemetry collector configuration
- **fluentd.conf**: Fluentd logging configuration

### Summaries (`docs/summaries/`)
- **COMPLETE_ORDER_SUBMACHINE_SUMMARY.md**: State machine implementation summary
- **WITH_SERVER_STATE_SUMMARY.md**: Server state management summary
- **TOME_SSR_SUMMARY.md**: Server-side rendering summary
- **TRACING_SUMMARY.md**: Distributed tracing implementation summary

## 🧪 Testing Infrastructure

### Editor Tests (`src/component-middleware/generic-editor/tests/`)
- **`demos/`**: Demo and example tests
- **`integration/`**: Integration test scenarios
- **`features/`**: Feature-specific test cases

### E2E Tests (`tests/e2e/`)
- Playwright-based end-to-end testing
- Component interaction testing
- User workflow validation

## 🔧 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Playwright Tests**
   ```bash
   npx playwright test
   ```

## 📚 Learning Path

### For Beginners
1. Start with `docs/guides/LOGGING_WAREHOUSING_GUIDE.md`
2. Review `docs/summaries/` for project overview
3. Explore `src/component-middleware/generic-editor/tests/demos/`

### For Developers
1. Review `docs/architecture/` for system design
2. Study `src/CompleteOrderStateMachine.js` for state machine patterns
3. Explore `src/component-middleware/generic-editor/templates/` for component examples

### For Integration
1. Check `docs/configs/` for service configuration
2. Review `src/component-middleware/generic-editor/tests/integration/`
3. Study `docs/features/` for advanced capabilities

## 🎨 Component Templates

The project includes several component templates:
- **Burger Cart Component**: E-commerce cart with ingredient builder
- **HTML Editor**: Rich text editing capabilities
- **CSS Editor**: Style editing and management
- **JavaScript Editor**: Code editing with syntax highlighting
- **XState Editor**: State machine visualization and editing

## 🔍 Finding What You Need

### Looking for Examples?
- Check `tests/demos/` for working examples
- Review `docs/examples/` for code samples

### Need Configuration?
- Look in `docs/configs/` for service configurations
- Check `docker-compose.yml` for environment setup

### Want to Learn?
- Start with `docs/guides/` for tutorials
- Review `docs/summaries/` for project overview

### Building Components?
- Explore `templates/` for component patterns
- Check `tests/features/` for feature implementations

## 📝 Contributing

When adding new content:
1. **Documentation**: Place in appropriate `docs/` subdirectory
2. **Tests**: Organize in relevant `tests/` subdirectory
3. **Examples**: Add to `docs/examples/` or `tests/demos/`
4. **Configs**: Store in `docs/configs/`

## 🎯 Future Enhancements

- [ ] Add more component templates
- [ ] Expand testing coverage
- [ ] Create interactive tutorials
- [ ] Add performance benchmarks
- [ ] Include more integration examples

---

This organized structure makes it easy to find specific information, examples, and implementations while maintaining a clear separation of concerns. Each directory serves a specific purpose and contains related content for easy discovery and reference.
