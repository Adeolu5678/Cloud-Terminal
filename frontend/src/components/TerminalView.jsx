import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useTerminalSettings } from "../hooks/useTerminalSettings";
import "xterm/css/xterm.css";

function TerminalView({ socket, terminalId }) {
  const containerRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const [settings] = useTerminalSettings();

  useEffect(() => {
    if (!terminalId || !socket || !containerRef.current) return;

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
      cursorBlink: settings.cursorBlink,
      cursorStyle: settings.cursorStyle,
      cursorWidth: 2,
      fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
      fontSize: settings.fontSize,
      lineHeight: 1.3,
      theme,
      scrollback: 5000,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    terminal.loadAddon(fitAddon);

    // Open immediately — the container already has real dimensions because
    // Workspace.jsx wraps it in `absolute inset-0` inside a positioned parent.
    terminal.open(containerRef.current);
    termInstance.current = terminal;

    const onDataDisposable = terminal.onData((data) => {
      socket.emit("terminal:input", { terminalId, data });
    });

    const handleOutput = ({ data }) => {
      terminal.write(data);
    };

    const eventName = `terminal:output:${terminalId}`;
    socket.on(eventName, handleOutput);

    // Use a single rAF so the browser commits the layout before fit() measures.
    // This is the fix for the blank canvas: layout is guaranteed to be non-zero
    // by the time fit() runs, because the container is absolute-positioned.
    let rafId = requestAnimationFrame(() => {
      try {
        fitAddon.fit();
        if (terminal.cols > 0 && terminal.rows > 0) {
          socket.emit("terminal:resize", { terminalId, cols: terminal.cols, rows: terminal.rows });
        }
        // Request history only after the terminal is fitted and rendered
        // Request history only after the terminal is fitted and rendered
        socket.emit("terminal:requestHistory", { terminalId });
        terminal.focus();
      } catch (err) {
        console.warn("TerminalView: Error during initial fit", err);
      }
    });

    // ResizeObserver only for subsequent window/layout resizes — NOT the initial open.
    let resizeTimeout;
    let lastW = 0;
    let lastH = 0;
    let initialized = false;

    const resizeObserver = new ResizeObserver((entries) => {
      // Skip the very first observation (fired immediately on observe())
      // to avoid double-fitting right after open().
      if (!initialized) {
        initialized = true;
        const { width, height } = entries[0].contentRect;
        lastW = width;
        lastH = height;
        return;
      }

      clearTimeout(resizeTimeout);
      const { width, height } = entries[0].contentRect;

      // Sub-pixel guard: prevent infinite loops from xterm's own DOM mutations
      if (Math.abs(lastW - width) < 1 && Math.abs(lastH - height) < 1) return;
      lastW = width;
      lastH = height;

      resizeTimeout = setTimeout(() => {
        try {
          fitAddon.fit();
          if (terminal.cols > 0 && terminal.rows > 0) {
            socket.emit("terminal:resize", { terminalId, cols: terminal.cols, rows: terminal.rows });
          }
        } catch (err) {
          console.warn("TerminalView: Error during resize", err);
        }
      }, 100);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      onDataDisposable.dispose();
      socket.off(eventName, handleOutput);
      resizeObserver.disconnect();
      terminal.dispose();
      termInstance.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, terminalId]);

  useEffect(() => {
    if (termInstance.current) {
      termInstance.current.options.fontSize = settings.fontSize;
      termInstance.current.options.cursorStyle = settings.cursorStyle;
      termInstance.current.options.cursorBlink = settings.cursorBlink;
      
      if (fitAddonRef.current) {
        // give it a tick to apply font changes before fitting
        setTimeout(() => {
          try {
            fitAddonRef.current.fit();
            if (termInstance.current.cols > 0 && termInstance.current.rows > 0) {
              socket.emit("terminal:resize", { terminalId, cols: termInstance.current.cols, rows: termInstance.current.rows });
            }
          } catch (err) {
            console.warn("TerminalView: Error during settings update fit", err);
          }
        }, 10);
      }
    }
  }, [settings, socket, terminalId]);

  const handleContainerClick = () => {
    termInstance.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="absolute inset-0 terminal-container [&_.xterm-viewport]:!bg-transparent [&_.xterm-viewport]:!overflow-y-auto [&_.xterm-viewport::-webkit-scrollbar]:w-1.5 [&_.xterm-viewport::-webkit-scrollbar-track]:bg-transparent [&_.xterm-viewport::-webkit-scrollbar-thumb]:bg-dark-600 [&_.xterm-viewport::-webkit-scrollbar-thumb:hover]:bg-primary-500 [&_.xterm-viewport::-webkit-scrollbar-thumb]:rounded-full"
    />
  );
}

export default TerminalView;
