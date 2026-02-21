Cloud Terminal: Implementation Plan & Architecture
A "Broke Student" Edition for Solo Development
1. High-Level Overview
This application is a Persistent Web-Based Terminal. It acts as a bridge between a mobile-friendly React PWA and a Linux VPS.
The Goal: Enable remote coding and agent management (Kilo/OpenClaw) from a mobile device without losing session state.
The Constraint: $0 budget, utilizing GitHub Student Developer Pack resources.
The User: Single-user (You). Authentication is simplified (hardcoded token).
2. The Tech Stack
Frontend: React (Vite), Tailwind CSS, xterm.js (Terminal rendering), xterm-addon-fit.
Backend: Node.js, Express, node-pty (Pseudo-terminal), socket.io (Real-time communication).
System Level: tmux (Terminal Multiplexer for persistence), Ubuntu (VPS OS).
Deployment: * Frontend: Cloudflare Pages (Free) or served statically by the backend.
Backend: DigitalOcean Droplet (via Student Pack).
Tunneling: Cloudflare Tunnel (to provide free HTTPS required for PWA).
3. Architecture Diagram
graph TD
    User[Mobile Phone (PWA)] <-->|WebSocket (Socket.io)| Tunnel[Cloudflare Tunnel (HTTPS)]
    Tunnel <-->|HTTP/WS| NodeServer[Node.js Backend]
    
    subgraph "VPS (DigitalOcean)"
        NodeServer -- Spawns --> PTY[node-pty Process]
        PTY -- Attaches to --> Tmux[Tmux Session]
        
        subgraph "Tmux Windows (Agents)"
            Win0[Window 0: Shell/Coding]
            Win1[Window 1: Kilo Agent A]
            Win2[Window 2: Kilo Agent B]
        end
        
        Tmux -- Controls --> Win0
        Tmux -- Controls --> Win1
        Tmux -- Controls --> Win2
    end


4. Feature Implementation Breakdown
A. The Backend (The Brain)
The backend does not run the shell directly; it runs tmux.
Initialization: When the server starts, it checks if a tmux session named cloud-term exists. If not, it creates it.
Connection: When the frontend connects via WebSocket, node-pty spawns a process: tmux attach -t cloud-term.
Resizing: Listens for resize events from the frontend and adjusts the pty size so text flows correctly on mobile.
B. The Frontend (The Interface)
Terminal Component: Wraps xterm.js. Handles rendering the incoming text stream and capturing keystrokes.
Mobile Virtual Keyboard: A fixed bottom bar (as seen in your screenshots) containing:
ESC, CTRL, ALT, TAB, Arrow Keys.
These buttons manually send specific hex codes via the WebSocket (e.g., sending \x1b for ESC).
Session Switcher: A sidebar menu that sends commands to tmux to switch windows (e.g., sending CTRL+b, 1 to switch to window 1) without the user needing to type the hotkeys.
C. The "Manual OpenClaw" Integration
Instead of complex database logic for agents, we map "Agents" to "Tmux Windows".
UI Logic: The "Servers/Agents" list in the sidebar corresponds to Tmux window indices.
"Project Wind" -> Window 0
"Kilo Coder" -> Window 1
"Kilo Researcher" -> Window 2
Action: Clicking "Kilo Coder" in the UI sends the tmux select-window -t 1 command to the backend.
5. Step-by-Step Implementation Phases
Phase 1: The "Hello World" Connection
Goal: Type in browser, see it on server console.
Tasks:
Initialize Node.js + Express + Socket.io.
Implement node-pty to spawn bash.
Setup React with xterm.js.
Establish bidirectional flow: xterm onData -> Socket -> pty write.
Phase 2: Persistence & Security
Goal: Close browser, reopen, see same text.
Tasks:
Change node-pty command from bash to tmux new-session -A -s main.
Add a simple password check in the WebSocket handshake (Middleware).
Create the "Lock Screen" UI in React.
Phase 3: Mobile Optimization
Goal: Usable coding experience on a phone.
Tasks:
Implement the Virtual Keyboard bar (ESC, Arrows, Ctrl).
Handle "Viewport" issues (prevent mobile keyboard from covering the terminal input).
Add manifest.json to make it installable (PWA).
Phase 4: Multi-Agent UI
Goal: Switch between projects/agents easily.
Tasks:
Create the Sidebar UI.
Add logic to query tmux list-windows and display them as a list.
Add click handlers to switch windows.
