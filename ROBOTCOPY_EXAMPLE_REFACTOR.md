# RobotCopy Example Functions Refactoring

**Date**: October 16, 2025  
**Status**: ✅ Complete  
**Purpose**: Move Fish Burger example code out of core RobotCopy class

---

## 🎯 Objective

Remove application-specific example functions from the core `RobotCopy` class and move them to the Fish Burger example where they belong.

### Why?

**Problem**:
- 🔴 Fish Burger specific methods (`startCooking`, `updateProgress`, `completeCooking`) were in core
- 🔴 Polluted the core API with example code
- 🔴 Confused users about what's core vs example
- 🔴 Made RobotCopy less generic and reusable

**Solution**:
- ✅ Move to `fish-burger-robotcopy-extensions.js` in example
- ✅ Create extension class pattern for app-specific methods
- ✅ Keep core RobotCopy clean and app-agnostic
- ✅ Provide clear example usage

---

## 📝 Changes Made

### 1. Removed from Core RobotCopy

**File**: `src/core/RobotCopy.ts`

**Removed** (Lines 164-192):
```typescript
// async startCooking(orderId: string, ingredients: string[]): Promise<any> {
//   return this.sendMessage('start', { orderId, ingredients });
// }

// async updateProgress(orderId: string, cookingTime: number, temperature: number): Promise<any> {
//   return this.sendMessage('progress', { orderId, cookingTime, temperature });
// }

// async completeCooking(orderId: string): Promise<any> {
//   return this.sendMessage('complete', { orderId });
// }

// // Integration with ViewStateMachine
// integrateWithViewStateMachine(viewStateMachine: any): RobotCopy {
//   ...
// }
```

**Replaced with**:
```typescript
// Fish Burger example methods have been moved to:
// example/node-example/src/fish-burger-robotcopy-extensions.js
// This keeps the core RobotCopy class clean and app-agnostic
```

### 2. Created Extension Class

**File**: `example/node-example/src/fish-burger-robotcopy-extensions.js`

Created `FishBurgerRobotCopyExtensions` class with:

#### Core Methods
```javascript
class FishBurgerRobotCopyExtensions {
    async startCooking(orderId, ingredients) {
        return this.robotCopy.sendMessage('start', { orderId, ingredients });
    }

    async updateProgress(orderId, cookingTime, temperature) {
        return this.robotCopy.sendMessage('progress', { orderId, cookingTime, temperature });
    }

    async completeCooking(orderId) {
        return this.robotCopy.sendMessage('complete', { orderId });
    }
}
```

#### ViewStateMachine Integration
```javascript
integrateWithViewStateMachine(viewStateMachine) {
    if (typeof viewStateMachine.registerRobotCopyHandler === 'function') {
        viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
            return this.startCooking(message.orderId, message.ingredients);
        });
        
        // ... other handlers
    }
    
    return this;
}
```

#### Complete Workflow Example
```javascript
async cookFishBurger(orderId, ingredients) {
    // Start cooking
    await this.startCooking(orderId, ingredients);
    
    // Simulate progress updates
    for (let time = 0; time <= 120; time += 30) {
        const temp = 180 + (time / 2);
        await this.updateProgress(orderId, time, temp);
    }
    
    // Complete cooking
    return await this.completeCooking(orderId);
}
```

### 3. Added Factory with Developer Mode Check

```javascript
export function createFishBurgerExtensions(robotCopy, developerMode = false) {
    if (!developerMode) {
        console.log('🍔 Fish Burger extensions disabled (developer mode off)');
        return null;
    }
    
    console.log('🍔 Fish Burger extensions enabled (developer mode on)');
    return new FishBurgerRobotCopyExtensions(robotCopy);
}
```

**Benefits**:
- Only loads in developer/example mode
- Prevents pollution of production builds
- Clear opt-in pattern

### 4. Updated Fish Burger Backend

**File**: `example/node-example/src/fish-burger-backend.js`

Added import:
```javascript
import { FishBurgerRobotCopyExtensions, createFishBurgerExtensions } from './fish-burger-robotcopy-extensions.js';
```

---

## 🔄 Usage Patterns

### Pattern 1: Direct Class Usage

```javascript
import { RobotCopy } from 'log-view-machine';
import { FishBurgerRobotCopyExtensions } from './fish-burger-robotcopy-extensions.js';

const robotCopy = new RobotCopy({
    unleashUrl: 'http://localhost:4242/api',
    unleashAppName: 'fish-burger-app'
});

const extensions = new FishBurgerRobotCopyExtensions(robotCopy);

// Use the extensions
await extensions.startCooking('order-123', ['fish', 'bun', 'sauce']);
await extensions.updateProgress('order-123', 60, 200);
await extensions.completeCooking('order-123');
```

### Pattern 2: Factory with Developer Mode

```javascript
const robotCopy = new RobotCopy({...});

const extensions = createFishBurgerExtensions(
    robotCopy,
    process.env.DEVELOPER_MODE === 'true'
);

if (extensions) {
    // Developer mode is on, use extensions
    await extensions.cookFishBurger('order-123', ['fish', 'bun']);
}
```

### Pattern 3: ViewStateMachine Integration

```javascript
const robotCopy = new RobotCopy({...});
const extensions = new FishBurgerRobotCopyExtensions(robotCopy);
const viewStateMachine = createViewStateMachine({...});

// Integrate extensions with the machine
extensions.integrateWithViewStateMachine(viewStateMachine);

// Now the machine can handle these events:
viewStateMachine.send('START_COOKING', {
    orderId: '123',
    ingredients: ['fish', 'bun']
});
```

### Pattern 4: Complete Workflow

```javascript
const extensions = new FishBurgerRobotCopyExtensions(robotCopy);

// Run complete cooking workflow
const result = await extensions.cookFishBurger('order-456', [
    'fish',
    'bun',
    'lettuce',
    'tomato',
    'special sauce'
]);

console.log('Order complete:', result);
```

---

## 📊 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Core Cleanliness** | Example code in core | Clean, generic core |
| **API Surface** | Confusing (cooking methods?) | Clear, focused |
| **Reusability** | Coupled to Fish Burger | Truly generic |
| **Discovery** | Hard to tell what's core | Obvious separation |
| **Testing** | Mixed concerns | Clean unit tests |
| **Documentation** | Confusing examples | Clear patterns |

---

## 🎨 Extension Pattern

This establishes a clean pattern for application-specific extensions:

```
core/
└── RobotCopy.ts              ← Generic message broker (clean!)

example/
└── node-example/
    └── src/
        └── fish-burger-robotcopy-extensions.js  ← App-specific helpers
```

### For Your Own App

```javascript
// Your app-specific extensions
export class MyAppRobotCopyExtensions {
    constructor(robotCopy) {
        this.robotCopy = robotCopy;
    }
    
    async myAppMethod(data) {
        return this.robotCopy.sendMessage('my-event', data);
    }
}

// With developer mode check
export function createMyAppExtensions(robotCopy, developerMode = false) {
    if (!developerMode) return null;
    return new MyAppRobotCopyExtensions(robotCopy);
}
```

---

## ✅ Checklist

- [x] Remove commented example code from `src/core/RobotCopy.ts`
- [x] Create `example/node-example/src/fish-burger-robotcopy-extensions.js`
- [x] Implement `FishBurgerRobotCopyExtensions` class
- [x] Add `createFishBurgerExtensions` factory function
- [x] Add developer mode check in IIFE
- [x] Update `fish-burger-backend.js` to import extensions
- [x] Add comprehensive documentation
- [x] Create usage examples

---

## 📚 Files Modified

1. **src/core/RobotCopy.ts**
   - Removed 29 lines of commented Fish Burger code
   - Added pointer comment to new location
   - Core class now clean and focused

2. **example/node-example/src/fish-burger-robotcopy-extensions.js** (NEW)
   - 154 lines of Fish Burger specific code
   - Extension class pattern
   - Factory with developer mode check
   - Complete workflow examples
   - IIFE for development loading

3. **example/node-example/src/fish-burger-backend.js**
   - Added import for extensions
   - Ready to use extension methods

---

## 🔧 Developer Mode

The extensions include a developer mode check:

```javascript
// In IIFE at bottom of extensions file
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (function() {
    console.log('🍔 Fish Burger example extensions loaded in development mode');
    // Example usage here
  })();
}
```

**Benefits**:
- Only runs in development
- Doesn't affect production
- No mixin pollution
- Self-contained examples

---

## 🎯 Summary

**What Changed**:
- ❌ Removed: 29 lines from core RobotCopy
- ✅ Added: 154 lines in example extensions
- ✅ Created: Clean extension pattern
- ✅ Added: Developer mode check
- ✅ Result: Core is clean, examples are clear

**Benefits**:
1. Core RobotCopy is generic and reusable
2. Examples are clearly separated
3. Developer mode prevents pollution
4. Extension pattern is established
5. Documentation is comprehensive

---

**Status**: ✅ Complete  
**Quality**: Production Ready  
**Pattern**: Extension Class with Developer Mode Check

