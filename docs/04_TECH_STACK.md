# 04_TECH_STACK.md — Technology Stack

## Recommended Stack (Aligned to Brief)

| Layer | Technology | Why It Fits This Project |
|---|---|---|
| Frontend | React (Vite) | Fast iteration, component-based UI for terminal + sidebar + lock screen |
| Styling | Tailwind CSS | Rapid mobile-first styling for control bars and responsive layout |
| Terminal UI | xterm.js + xterm-addon-fit | Standard browser terminal rendering with dynamic fit/resizing |
| Realtime Transport | Socket.io | Reliable bidirectional client/server stream for terminal I/O and control events |
| Backend Runtime | Node.js (v20 via NVM) | Matches required ecosystem and node-pty compatibility in setup guide |
| Backend Framework | Express | Lightweight HTTP server integration with Socket.io |
| PTY Integration | node-pty | Provides pseudo-terminal bridge from backend to tmux/shell |
| Session Persistence | tmux | Core persistence mechanism when browser disconnects/reconnects |
| OS / Host | Ubuntu 24.04 LTS on DigitalOcean | Explicitly stated in VPS setup with student-credit cost fit |
| HTTPS Ingress | Cloudflare Tunnel | Free HTTPS exposure for PWA usage without complex TLS setup |
| Frontend Hosting Option | Cloudflare Pages (optional) | Free static deployment path noted in implementation plan |

## Package/Library Notes
- **node-pty build prerequisites:** `build-essential`, `python3`, `make`, `g++` are required on VPS.
- **Socket + PTY pattern:** Keeps terminal interactions event-driven and low-latency.
- **tmux mapping model:** “Agents” correspond directly to tmux windows; avoids extra DB complexity in MVP.

## Deployment Topology
1. Backend runs on VPS (port `[REQUIRES CLARIFICATION]`, example in brief: 3000).
2. Cloudflare Tunnel routes HTTPS traffic to backend.
3. Frontend is either:
   - served statically from backend, or
   - deployed to Cloudflare Pages and connected to backend tunnel endpoint.

## Technical Constraints / Preferences Captured from Brief
- Zero-budget objective using student/free-tier services.
- Mobile-first UX requirement.
- Single-user mode with simplified authentication.
- Persistent shell state via tmux instead of database-driven session persistence.

## Open Decisions
- Production authentication mechanism (beyond hardcoded token): `[REQUIRES CLARIFICATION]`
- Secret/config management strategy: `[REQUIRES CLARIFICATION]`
- Monitoring/logging stack: `[REQUIRES CLARIFICATION]`
- Whether frontend is co-hosted with backend or hosted separately on Pages: `[REQUIRES CLARIFICATION]`

