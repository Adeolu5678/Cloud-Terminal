# 03_SSD.md — System Sequence Document (SSD)

This document defines interaction flows for the three core user journeys implied by the project brief.

## Journey 1: Connect and Start Persistent Terminal Session

### Steps

1. User opens PWA on mobile.
2. Frontend prompts for lock/token (if not already unlocked).
3. Frontend establishes Socket.io connection through Cloudflare Tunnel.
4. Backend validates handshake token.
5. Backend ensures `cloud-term` tmux session exists.
6. Backend spawns PTY attached to tmux session.
7. Terminal output begins streaming to frontend xterm.
8. User input is relayed back to PTY in real time.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React PWA
    participant CF as Cloudflare Tunnel
    participant BE as Node/Socket.io
    participant PTY as node-pty
    participant TM as tmux (cloud-term)

    U->>FE: Open app + unlock
    FE->>CF: Socket connect (token)
    CF->>BE: Forward connection
    BE->>BE: Validate handshake token
    BE->>TM: has-session cloud-term?
    alt session missing
        BE->>TM: create session
    end
    BE->>PTY: spawn/attach tmux
    PTY->>TM: attach -t cloud-term
    TM-->>PTY: terminal stream
    PTY-->>BE: output data
    BE-->>FE: terminal:output
    FE-->>U: render in xterm
    U->>FE: type input
    FE->>BE: terminal:input
    BE->>PTY: write input
```

## Journey 2: Use Mobile Virtual Keyboard Controls

### Steps

1. User taps a virtual control key (e.g., ESC/CTRL/Arrow).
2. Frontend maps button to control sequence bytes.
3. Frontend sends encoded data to backend via socket.
4. Backend writes bytes to PTY.
5. PTY/tmux process interprets control sequence.
6. Updated terminal output is streamed back.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Virtual Keyboard UI
    participant BE as Node/Socket.io
    participant PTY as node-pty
    participant TM as tmux/shell

    U->>FE: Tap ESC / CTRL / Arrow
    FE->>FE: Map to control bytes (e.g. \x1b)
    FE->>BE: terminal:input {data}
    BE->>PTY: write(data)
    PTY->>TM: apply key sequence
    TM-->>PTY: updated output
    PTY-->>BE: output
    BE-->>FE: terminal:output
```

## Journey 3: Switch Between Agent Windows (tmux)

### Steps

1. Frontend requests or receives current tmux windows.
2. User clicks agent/window item in sidebar.
3. Frontend emits session-switch intent with target index.
4. Backend executes tmux window select operation.
5. Active stream now reflects selected window context.

### Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Sidebar UI
    participant BE as Node/Socket.io
    participant TM as tmux
    participant PTY as node-pty stream

    FE->>BE: session:list request
    BE->>TM: list-windows
    TM-->>BE: window metadata
    BE-->>FE: session:list response {windows}

    U->>FE: Click target agent/window
    FE->>BE: session:switch {windowIndex:1}
    BE->>TM: select-window -t 1
    TM-->>PTY: active window output
    PTY-->>BE: stream data
    BE-->>FE: terminal:output
    FE-->>U: updated terminal context
```

## Clarifications Needed

- Exact socket event names are inferred and may differ from implementation. `[REQUIRES CLARIFICATION]`
- Error-handling flows for failed auth, disconnected PTY, and missing tmux are not explicitly detailed. `[REQUIRES CLARIFICATION]`
