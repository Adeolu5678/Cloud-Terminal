import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";

function TerminalView({ socket, terminalId }) {
  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalId || !socket) return;
    
    // Custom tailwind-matching theme
    const theme = {
      background: "transparent",
      foreground: "#f1f5f9",
      cursor: "#38bdf8",
      cursorAccent: "#0f172a",
      selectionBackground: "#38bdf840",
      black: "#0f172a",
      red: "#ef4444",
      green: "#22c55e",
      yellow: "#eab308",
      blue: "#3b82f6",
      magenta: "#d946ef",
      cyan: "#06b6d4",
      white: "#f8fafc",
      brightBlack: "#64748b",
      brightRed: "#f87171",
      brightGreen: "#4ade80",
      brightYellow: "#facc15",
      brightBlue: "#60a5fa",
      brightMagenta: "#e879f9",
      brightCyan: "#22d3ee",
      brightWhite: "#ffffff",
    };

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 2,
      fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
      fontSize: 14,
      lineHeight: 1.3,
      theme,
      scrollback: 5000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;

    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    termInstance.current = terminal;

    const onDataDisposable = terminal.onData((data) => {
      socket.emit("terminal:input", { terminalId, data });
    });

    const handleOutput = ({ data }) => {
      terminal.write(data);
    };

    const eventName = `terminal:output:${terminalId}`;
    socket.on(eventName, handleOutput);
    
    // Request historical data
    socket.emit("terminal:requestHistory", { terminalId });

    // Use ResizeObserver for robust containment resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Only fit and focus if the tab is actively visible (dimensions > 0)
        if (width > 0 && height > 0) {
          try {
            fitAddon.fit();
            socket.emit("terminal:resize", {
              terminalId,
              cols: terminal.cols,
              rows: terminal.rows,
            });
            
            // Force a microtask delay to ensure canvas is fully painted before capturing focus
            setTimeout(() => {
               terminal.focus();
            }, 0);
          } catch {
            // ignore fit errors during fast resizes
          }
        }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      onDataDisposable.dispose();
      socket.off(eventName, handleOutput);
      resizeObserver.disconnect();
      terminal.dispose();
      termInstance.current = null;
    };
  }, [socket, terminalId]);

  const handleContainerClick = () => {
    if (termInstance.current) {
      termInstance.current.focus();
    }
  };

  // Custom styling to hide xterm scrollbar since we have a container scrollbar if needed,
  // but xterm handles its own scrolling.
  return (
    <div
      ref={terminalRef}
      onClick={handleContainerClick}
      className="w-full h-full terminal-container [&_.xterm-viewport]:!bg-transparent [&_.xterm-viewport]:!overflow-y-auto [&_.xterm-viewport::-webkit-scrollbar]:w-1.5 [&_.xterm-viewport::-webkit-scrollbar-track]:bg-transparent [&_.xterm-viewport::-webkit-scrollbar-thumb]:bg-dark-600 [&_.xterm-viewport::-webkit-scrollbar-thumb:hover]:bg-primary-500 [&_.xterm-viewport::-webkit-scrollbar-thumb]:rounded-full"
    />
  );
}

export default TerminalView;
