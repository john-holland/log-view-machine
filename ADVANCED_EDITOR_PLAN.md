# Advanced Editor - Next Phase Plan

**Prerequisite**: Phases 1-4 of focused modding platform complete  
**Estimated Time**: 15-20 hours  
**Goal**: Full-featured modding platform with offline development and online review

---

## Overview

Build a comprehensive advanced editor that allows users to:
- Develop mods offline in a premium 3-panel drag-and-drop editor
- Test locally before submitting
- Review online with diff viewer and comments
- Manage their own mods (create/review/delete)
- Review others' mods upon request

---

## Phase A: Advanced Editor UI (5-6 hours)

### A.1 Create CanvasMachine (1.5 hours)

**File**: `src/editor/machines/canvas-machine.ts`

**States**: `idle`, `dragging`, `dropping`, `panning`, `zooming`, `selecting`, `loading`, `reviewing`, `publishing`

**Context**:
```typescript
{
  placedComponents: PlacedComponent[];
  selectedComponents: string[];
  canvasTransform: { x, y, scale };
  draggedComponent: PlacedComponent | null;
  gridSize: number;
  snapToGrid: boolean;
}
```

**Events**: DRAG_START, DRAG_OVER, DROP, PAN_START/MOVE/END, ZOOM_IN/OUT, SELECT, DELETE, START_PHASE, END_PHASE

**Integration**: Register with EditorTome router, use routed send

### A.2 Create ComponentLibraryMachine (1 hour)

**File**: `src/editor/machines/component-library-machine.ts`

**States**: `loading`, `loaded`, `searching`, `dragging`

**Context**:
```typescript
{
  components: WhitelistedComponent[];
  filteredComponents: WhitelistedComponent[];
  searchQuery: string;
  filters: { category?, tags[], moddableOnly };
}
```

**Data Source**: WhitelistService for moddable components

### A.3 Update EditorTome (30 min)

**File**: `src/editor/tomes/EditorTome.ts`

Add to existing tome:
- Register CanvasMachine
- Register ComponentLibraryMachine  
- Set up routed send between Canvas ↔ Preview ↔ Editor
- Load PACT test idle state if available
- Add methods: `placeComponent()`, `loadComponentLibrary()`

### A.4 Build 3-Panel Layout (2 hours)

**File**: `src/components/AdvancedEditor.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Top Bar: Save • Review • Publish                      │
├──────────┬──────────────────────────┬──────────────────┤
│  Left    │  Center (5 tabs)         │  Right           │
│  Sidebar │  1. WYSIWYG              │  Properties      │
│          │  2. Preview              │  - Name          │
│  Comp    │  3. XState Visualizer    │  - Context       │
│  Library │  4. Structural Routing   │  - Type          │
│  Search  │  5. PACT Test Data       │                  │
│  Filter  │                          │                  │
└──────────┴──────────────────────────┴──────────────────┘
```

**Components**:
- `<CanvasView />` - Drag-drop canvas with pan/zoom
- `<ComponentLibrary />` - Sidebar with draggable components
- `<TabSystem />` - 5 tabs as specified
- `<PropertiesPanel />` - Right sidebar

### A.5 Implement Drag & Drop (1 hour)

- Drag from ComponentLibrary to Canvas
- Visual feedback (dashed border, highlight)
- Drop zones in WYSIWYG tab
- Grid snap
- Component selection
- Keyboard shortcuts (Delete, Ctrl+Z)

---

## Phase B: Marketplace State Machines (4-5 hours)

### B.1 Create MarketplaceTome (1 hour)

**File**: `src/marketplace/tomes/MarketplaceTome.ts`

Extend TomeBase, coordinate:
- BrowserMachine
- SubmissionMachine
- ReviewMachine

Share AuthService and WhitelistService

### B.2 Create BrowserMachine (1.5 hours)

**File**: `src/marketplace/machines/browser-machine.ts`

**States**: `browsing`, `searching`, `filtering`, `viewing_mod`, `installing`

**Features**:
- Search, filter, sort
- Install/uninstall
- Token balance checking
- Track installed mods

### B.3 Create SubmissionMachine (1.5 hours)

**File**: `src/marketplace/machines/submission-machine.ts`

**States**: `draft`, `uploading`, `linting`, `scanning_pii`, `pending_review`, `submitted`

**Integration**: 
- Lint results from Phase 1
- PII scan
- Validation
- Submit to review queue

### B.4 Create ReviewMachine (1 hour)

**File**: `src/marketplace/machines/review-machine.ts`

**States**: `queue`, `reviewing`, `approving`, `rejecting`, `flagging`

**Features**:
- Load review queue
- Filter by status
- Approve/reject/flag with notes
- PII override

---

## Phase C: Docker & OAuth Integration (5-6 hours)

### C.1 PostgreSQL Docker Setup (1 hour)

**File**: Update `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: wave_reader_premium
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

Auto-run schema on first start

### C.2 dotCMS Docker Setup (2 hours)

**File**: `docker-compose.yml`

```yaml
  dotcms:
    image: dotcms/dotcms:latest
    ports:
      - "8080:8080"
    volumes:
      - ./dotcms-data:/data/shared
      - ./dotcms-s3-config:/config
    environment:
      DB_HOST: postgres
      DB_NAME: wave_reader_premium
    depends_on:
      postgres:
        condition: service_healthy
```

**S3 Volume Support**: Map to S3 or local with adapter

### C.3 Google OAuth Integration (2-3 hours)

**File**: `src/services/auth-service.ts` (update existing)

- Install `google-auth-library`
- Real token verification
- User creation on first login
- JWT generation

**Endpoints** (`src/editor-server.ts`):
- `GET /auth/google` - Redirect to Google
- `GET /auth/google/callback` - Handle callback
- `POST /auth/verify` - Verify JWT
- `POST /auth/logout` - Invalidate

**Frontend** (`src/components/AuthButton.tsx`):
- "Sign in with Google" button
- User avatar and email display
- User type badge
- Sign out button

---

## Phase D: Streamlined UX & Self-Service (3-4 hours)

### D.1 Simplified Advanced Editor Flow (1.5 hours)

**User Experience**:
```
1. Sign in with Google (one click)
2. Select component to mod (dropdown or grid)
3. Advanced editor opens with 3 panels
4. Develop in WYSIWYG/Preview/XState tabs
5. Properties panel auto-populated
6. Click Review → see diff + lint
7. Submit for review
```

**No unnecessary steps** - streamlined from concept to submission

### D.2 Self-Service Mod Management (1 hour)

**File**: `src/components/MyMods.tsx`

User dashboard to:
- View all their mods (draft, pending, approved, rejected)
- Edit drafts
- Delete mods
- See review comments
- Respond to reviewer feedback

### D.3 Peer Review System (1.5 hours)

**File**: `src/components/PeerReview.tsx`

Allow users to review mods upon request:
- See review requests
- View mod diff + lint results
- Add inline comments with '+'
- Approve or request changes
- Not binding (moderators have final say)

---

## Editor Guidelines Document

### Create: `docs/editor-guidelines.md`

**Sections**:

1. **Architecture Overview**
   - 3-panel layout philosophy
   - Routed tome communication
   - State machine orchestration

2. **Component Structure**
   - Left: ComponentLibrary (search, filter, drag)
   - Center: TabSystem (5 tabs with specific purposes)
   - Right: PropertiesPanel (context, name, type)

3. **Tab Specifications**
   - **WYSIWYG**: Drag-drop canvas, SunEditor integration
   - **Preview**: Live iframe with device toggle / PACT state response
   - **XState Visualizer**: State machine diagrams for component
   - **Structural Routing**: Tome config editor + visual tree
   - **PACT Test Data**: Contract test data forms

4. **State Machine Patterns**
   - Use ViewStateMachine for all machines
   - Routed send for inter-machine communication ✨
   - Services in xstateConfig, not external
   - Actions mutate context directly, clear log view pattern

5. **Drag & Drop Guidelines**
   - HTML5 drag API
   - Visual feedback requirements
   - Drop zone specifications
   - Grid snap behavior

6. **Review Modal Requirements**
   - File diff viewer (line-by-line)
   - Lint results display
   - Comment system (inline + general)
   - Shareable review links

7. **Code Quality Standards**
   - No string concatenation for HTML
   - No inline event handlers
   - All TypeScript with types
   - React components only
   - State in machines or hooks

8. **Build & Deploy**
   - Vite for bundling
   - Multiple entry points
   - dist/ structure
   - Docker containers

---

## Success Criteria

### Advanced Editor
- ✓ 3-panel layout responsive
- ✓ Drag component from library to canvas
- ✓ 5 tabs functional
- ✓ Properties panel updates
- ✓ Pan/zoom canvas
- ✓ Grid snap working

### Marketplace Complete
- ✓ State machines managing all flows
- ✓ Browse with full filters
- ✓ Submit with validation
- ✓ Review queue for moderators
- ✓ Install with token transfer
- ✓ 14-day token lock

### OAuth & Self-Service
- ✓ Google login working
- ✓ User provisioned automatically
- ✓ Dashboard shows user's mods
- ✓ Can review own mods
- ✓ Can review others upon request

### Infrastructure
- ✓ PostgreSQL in Docker
- ✓ dotCMS in Docker with S3 support
- ✓ Data persists across restarts
- ✓ Health checks pass

---

## Timeline

```
Phase A: Advanced Editor UI        5-6 hours
Phase B: Marketplace Machines       4-5 hours
Phase C: Docker & OAuth             5-6 hours
Phase D: UX & Self-Service          3-4 hours
──────────────────────────────────────────────
Total:                             17-21 hours
```

**Plus initial 4 phases**: 9-12 hours  
**Grand Total**: ~26-33 hours for complete platform

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Users (Google OAuth)                │
└─────────────┬───────────────────────────────────────┘
              │
         ┌────┴────┐
         │ Next.js │ (Marketplace Backend)
         │ Backend │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼───┐ ┌──▼──────┐
│Editor │ │Mktplc│ │ dotCMS  │
│ Tome  │ │ Tome │ │         │
└───┬───┘ └──┬───┘ └──┬──────┘
    │        │        │
    └────────┴────────┴─────────┐
                                 │
                          ┌──────▼──────┐
                          │ PostgreSQL  │
                          │   Docker    │
                          └─────────────┘
```

---

**This creates a complete, production-ready modding platform!** 🚀

