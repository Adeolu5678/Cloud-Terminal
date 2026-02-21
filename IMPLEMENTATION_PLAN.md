# IMPLEMENTATION_PLAN.md

## Proposed Folder Structure

```text
cloud-terminal/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── socket/
│   │   │   └── terminalSocket.js
│   │   ├── tmux/
│   │   │   ├── sessionManager.js
│   │   │   └── windowManager.js
│   │   └── auth/
│   │       └── socketAuth.js
│   ├── test/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TerminalView.jsx
│   │   │   ├── SessionSidebar.jsx
│   │   │   ├── VirtualKeyboard.jsx
│   │   │   └── LockScreen.jsx
│   │   ├── services/
│   │   │   └── socketClient.js
│   │   └── App.jsx
│   └── package.json
├── .env.example
└── docs/
```

## Database Schema (MVP)

- No external database is required for MVP.
- Persistent terminal state is delegated to tmux session `cloud-term`.
- Runtime models are:
  - `TerminalSession { name, exists }`
  - `TerminalWindow { index, name, active }`
  - `SocketConnection { socketId, authorized, cols, rows }`
  - `AuthToken { value }` (from environment configuration)

## Step-by-Step Implementation Checklist

- [ ] **Phase 1 — Context & Planning**
  - [x] Read PRD (`docs/01_PRD.md`)
  - [x] Read MDD (`docs/02_MDD.md`)
  - [x] Read SSD (`docs/03_SSD.md`)
  - [x] Read Tech Stack (`docs/04_TECH_STACK.md`)
  - [x] Produce this implementation plan
- [ ] **Phase 2 — Environment Setup & Scaffolding**
  - [ ] Initialize backend/frontend projects and install dependencies
  - [ ] Add `.env.example` with required variables
  - [ ] Configure linting/formatting
- [ ] **Phase 3 — Core Infrastructure (Backend)**
  - [ ] Implement tmux session bootstrap (`cloud-term`)
  - [ ] Implement Socket.io auth handshake
  - [ ] Implement PTY bridge + terminal input/output + resize
  - [ ] Implement window listing/switching events
  - [ ] Add core unit tests
- [ ] **Phase 4 — Frontend & Integration**
  - [ ] Build terminal UI with xterm + fit addon
  - [ ] Build lock screen + virtual keyboard + session sidebar
  - [ ] Integrate frontend socket events with backend contracts
  - [ ] Validate user flows from PRD on mobile-first layout

## Approval Gate

Per your protocol, I will pause here and wait for your approval before writing any application code.
