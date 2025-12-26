# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern, web-based Mermaid diagram editor built with **vanilla JavaScript** (no frameworks). Features real-time rendering, cloud storage, multiple export formats, and professional code editing capabilities.

**Live Site:** https://swkwon.github.io/mermaid-editor/

## Project Structure

```
mermaid-editor/
├── frontend/          # Static web application (vanilla JS)
│   ├── index.html
│   ├── about.html
│   ├── style.css
│   ├── main.js
│   ├── diagram.js
│   ├── ui.js
│   ├── export.js
│   ├── config.js
│   ├── utils.js
│   ├── firebase-manager.js
│   └── firebase-config.js
├── backend/           # Python Flask API (to be implemented)
└── .github/
    └── workflows/
        └── deploy.yml # Frontend deployment workflow
```

## Architecture

### Frontend Module Structure

The frontend uses **ES6 modules** with clear separation of concerns:

- **main.js** - Application orchestrator, initialization, Firebase integration
- **diagram.js** - Mermaid rendering engine, pan/zoom management, error handling
- **ui.js** - All UI event handlers and interactions (modular setup functions)
- **export.js** - Image/SVG/PDF export with theme-aware rendering
- **config.js** - Constants, messages, and 21 sample diagram templates
- **utils.js** - Shared utilities (debounce, file operations, SVG processing)
- **firebase-manager.js** - Firestore operations for cloud storage
- **firebase-config.js** - Firebase SDK initialization

### Data Flow

```
User Input (CodeMirror)
  → Debounced (300ms)
  → localStorage Auto-save (1-hour TTL)
  → Mermaid Rendering
  → SVG Pan/Zoom Init
  → UI State Update
```

### State Management

Uses **object references** for shared state (e.g., `isDarkMode = { value: false }`). Persistence via localStorage:
- `split-sizes` - Panel layout percentages
- `mermaid-code` - Editor content with timestamp
- `background-pattern` - dot/grid/none
- `dark-mode` - Theme preference
- `editorTheme` - CodeMirror theme selection

## Key Technical Patterns

### 1. Mermaid Rendering (diagram.js)

**Critical Pattern:** SVG elements return 0 dimensions when hidden. Solution:
```javascript
// Temporarily make visible with opacity: 0 for measurements
const wasDiagramHidden = diagramPane.style.display === 'none';
if (wasDiagramHidden) {
  diagramPane.style.display = 'block';
  diagramPane.style.opacity = '0';
}
// ... render and measure ...
// Restore original state
```

**Error Handling:** Calculates frontmatter offset to show accurate error line numbers in CodeMirror.

### 2. Export System (export.js)

**SVG → Image Pipeline:**
1. Clone SVG and inject inline CSS styles
2. Remove pan-zoom transformations
3. Serialize to Base64 data URL
4. Draw to Canvas with 20px padding
5. Apply theme-aware background (dark: `#1e1e1e`, light: white)
6. Export as PNG/JPG/PDF

**PDF Export:** Uses jsPDF with auto-orientation detection (landscape if width > height).

### 3. CodeMirror Integration

- **Mode:** YAML (supports Mermaid frontmatter)
- **Autocomplete:** 400+ Mermaid keywords, triggers on typing or Ctrl+Space
- **Themes:** 9 options persisted to localStorage
- **Change Handler:** Debounced 300ms → save + render

### 4. Firebase Cloud Storage

**Schema (Firestore `diagrams` collection):**
```javascript
{
  uid: string,           // User ID
  title: string,
  code: string,          // Mermaid code
  thumbnail: string,     // Base64 SVG (600×450, white bg)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Auth:** Google OAuth only (GitHub configured but not exposed in UI).

### 5. Mobile Responsiveness

**Breakpoint:** 768px
- **< 768px:** Toggle between Code OR Preview (`.show-code`/`.show-diagram` classes)
- **≥ 768px:** Resizable split view (Split.js)

### 6. Background Pattern System

Three-state cycle: dot → grid → none
- Injected via CSS `backgroundImage` and `backgroundSize`
- Theme-aware colors: `#444` (dark) vs `#d0d0d0` (light)

## Development

### Running Locally

**Frontend:**
No build process required. Serve static files from the `frontend/` directory:
```bash
cd frontend
python3 -m http.server 8000
# Or
npx serve
```

**Backend:**
To be implemented (Python Flask API)

### Dependencies (CDN)

- Mermaid v11 (jsDelivr)
- CodeMirror 5.65.16 (Cloudflare)
- Split.js 1.6.5 (unpkg)
- svg-pan-zoom 3.6.1 (jsDelivr)
- jsPDF 2.5.1 (Cloudflare)
- Firebase 10.12.0 (gstatic)

### Deployment

**Frontend Deployment (GitHub Actions):** `.github/workflows/deploy.yml`
- Triggers on push to `main` branch
- Deploys `frontend/` directory to Ubuntu server: `/var/www/mermaid-editor/`
- **No compilation step** - deploys static files directly

**Required Secrets:**
- `SSH_PRIVATE_KEY`
- `REMOTE_HOST`
- `REMOTE_PORT`
- `REMOTE_USER`

**Backend Deployment:**
To be implemented

## Important Conventions

### Debouncing
All render triggers use **300ms debounce** to prevent excessive re-rendering during typing.

### UI Setup Pattern
Each UI component has a dedicated `setup*()` function called from `main.js`:
- `setupUrlCodeLoading()`
- `setupCopyUrlButton()`
- `setupExportMenu()`
- `setupZoomControls()`
- etc.

### Error Resilience
- Try/catch around all async operations
- Toast notifications for user-facing errors
- Fallback messages in `CONFIG.MESSAGES`

### Modal Pattern
All modals use `.modal` + `.show` classes:
- Click outside to close
- Escape key to close
- Consistent structure across login/save/load modals

## Keyboard Shortcuts

- `Ctrl + +/-/0` - Zoom in/out/reset
- `Ctrl + i/k/j/l` - Pan diagram (up/down/left/right)
- `Ctrl + Space` - Trigger autocomplete

## Browser Requirements

- ES6 module support
- Clipboard API (HTTPS required for copy features)
- File System Access API (graceful fallback for save/load)

## Sample Diagrams

21 pre-configured templates in `config.js` covering all Mermaid diagram types:
- Flowchart, Sequence, Class, State, ER, Gantt, Pie, etc.
- Beta: Sankey, XYChart, Block, Packet, Kanban, Architecture
