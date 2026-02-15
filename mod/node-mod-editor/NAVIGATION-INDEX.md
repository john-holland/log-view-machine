# 🧭 Quick Navigation Index

---

## ⚠️ **For mod authors: external APIs**

Mods that call external APIs require those URLs to be on the CORS whitelist. **Test locally first.** Need a new service URL? **Email in with your API needs** and we'll add it—we're happy to oblige.

---

## 🚀 **Start Here**
- **[README.md](README.md)** - Main project overview
- **[README-ORGANIZED.md](README-ORGANIZED.md)** - Detailed project structure
- **[package.json](package.json)** - Dependencies and scripts

## 📚 **Documentation Hub** (`docs/`)
- **`guides/`** - How-to guides and tutorials
- **`configs/`** - Service configurations
- **`summaries/`** - Project summaries and reports
- **`examples/`** - Code examples and samples

## 🧪 **Testing & Examples**
- **`tests/e2e/`** - End-to-end tests
- **`test-results/`** - Test execution results
- **`playwright-report/`** - Playwright test reports

## 🎨 **Generic Editor** (`src/component-middleware/generic-editor/`)
- **[README-ORGANIZED.md](src/component-middleware/generic-editor/README-ORGANIZED.md)** - Editor structure
- **[index.html](src/component-middleware/generic-editor/index.html)** - Main editor interface
- **[templates/](src/component-middleware/generic-editor/templates/)** - Component templates
- **[tests/](src/component-middleware/generic-editor/tests/)** - Editor tests

## 🔧 **Key Components**
- **[CompleteOrderStateMachine.js](src/CompleteOrderStateMachine.js)** - State machine implementation
- **[tome-server.js](src/tome-server.js)** - Server implementation
- **[docker-compose.yml](docker-compose.yml)** - Docker configuration

## 🎯 **Quick Access by Need**

### **Want to Learn?**
- Start with `docs/guides/LOGGING_WAREHOUSING_GUIDE.md`
- Review `docs/summaries/` for project overview

### **Looking for Examples?**
- Check `src/component-middleware/generic-editor/tests/demos/`
- Review `src/component-middleware/generic-editor/templates/`

### **Need Configuration?**
- Look in `docs/configs/` for service configs
- Check `docker-compose.yml` for environment setup

### **Building Components?**
- Explore `src/component-middleware/generic-editor/templates/`
- Check `src/component-middleware/generic-editor/tests/features/`

## 🚀 **Getting Started Commands**
```bash
# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Run Playwright tests
npx playwright test
```

## 📖 **Documentation by Category**

### **Architecture & Design**
- `docs/summaries/COMPLETE_ORDER_SUBMACHINE_SUMMARY.md`
- `docs/summaries/TRACING_SUMMARY.md`
- `src/component-middleware/generic-editor/docs/architecture/`

### **Features & Implementation**
- `docs/summaries/WITH_SERVER_STATE_SUMMARY.md`
- `docs/summaries/TOME_SSR_SUMMARY.md`
- `src/component-middleware/generic-editor/docs/features/`

### **Guides & Tutorials**
- `docs/guides/LOGGING_WAREHOUSING_GUIDE.md`
- `src/component-middleware/generic-editor/docs/guides/`

### **Configuration & Setup**
- `docs/configs/otel-collector-config.yaml`
- `docs/configs/fluentd.conf`
- `docker-compose.yml`

---

**💡 Tip**: Use `Cmd/Ctrl + P` in your editor to quickly search for files by name!
