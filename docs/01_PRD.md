# 01_PRD.md — Product Requirements Document (PRD)

## Executive Summary
Cloud Terminal is a persistent, web-based terminal intended for a single user to remotely code and manage tmux-based agent workflows from a mobile device. The product bridges a mobile-friendly React PWA frontend to a Node.js backend running on a Linux VPS.

### Core Problem Statement
- Mobile remote coding workflows lose state when browser tabs close or sessions disconnect.
- Managing multiple agent contexts from mobile terminals is cumbersome without session/window orchestration.

### Target Outcome
- Provide persistent terminal sessions via tmux.
- Enable quick switching between agent contexts mapped to tmux windows.
- Support phone-first usability with a virtual keyboard for terminal control keys.

## Target Audience
| Segment | Description | Needs |
|---|---|---|
| Primary User | Solo developer/student (single-user setup) | Persistent remote terminal, mobile usability, low-cost hosting |
| Secondary User | [REQUIRES CLARIFICATION] | [REQUIRES CLARIFICATION] |

## User Personas
### Persona 1: Student Solo Builder
- Uses GitHub Student Pack benefits and low-cost VPS resources.
- Wants to run coding and AI agent workflows remotely from a phone.
- Needs low setup complexity and reliable session persistence.

### Persona 2: Mobile-First Operator
- Primarily connects through a mobile browser/PWA.
- Requires terminal control keys (ESC, CTRL, ALT, TAB, arrows) without physical keyboard access.

## User Stories
1. As a solo developer, I want my terminal session to persist after disconnects so I can continue work without losing context.
2. As a mobile user, I want virtual terminal keys so I can execute terminal workflows effectively on a phone.
3. As a user managing multiple agent contexts, I want to switch between tmux windows from the UI so I don’t need to manually type multiplexer shortcuts.
4. As a user, I want simple access protection for my terminal endpoint so unauthorized users cannot connect.

## MVP Features
- Web-based terminal UI using xterm.js.
- Real-time bidirectional terminal I/O via WebSocket (Socket.io).
- Backend PTY process management with node-pty.
- Persistent terminal sessions using tmux (`cloud-term` session).
- Basic lock/auth gate using a simple token/password check in WebSocket handshake.
- Mobile virtual keyboard with control keys.
- Sidebar/session switcher mapped to tmux windows.
- HTTPS exposure through Cloudflare Tunnel for PWA compatibility.

## Non-Functional Requirements
- **Cost constraint:** Operate with $0 incremental budget using student credits/free tiers.
- **Platform:** Ubuntu VPS (DigitalOcean from Student Pack context).
- **Latency sensitivity:** Deploy in region close to user for reduced typing latency.
- **Persistence:** Session state retained via tmux, not browser state.

## Assumptions & Constraints
- Single-user design only; multi-tenant requirements are out of scope.
- Authentication is intentionally simplified/hardcoded for MVP.
- Cloudflare Tunnel preferred for HTTPS ingress.
- Domain provisioning details are partially external and require user ownership.

## Future Scope
- Hardened authentication/authorization model beyond hardcoded token.
- Multi-user support and role boundaries. 
- Agent provisioning automation beyond manual tmux window mapping.
- Observability and audit logging. 
- Richer session metadata and persistence model (if needed).

