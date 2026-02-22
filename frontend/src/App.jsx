import { useEffect, useState } from "react";
import { LogOut, Activity } from "lucide-react";
import LockScreen from "./components/LockScreen";
import SessionSidebar from "./components/SessionSidebar";
import TerminalView from "./components/TerminalView";
import VirtualKeyboard from "./components/VirtualKeyboard";
import Overview from "./components/Overview";
import Workspace from "./components/Workspace";
import ActivityLog from "./components/ActivityLog";
import Users from "./components/Users";
import TerminalLock from "./components/TerminalLock";
import BottomNav from "./components/BottomNav";
import { createSocket } from "./services/socketClient";
import { AppProvider, useAppContext } from "./context/AppContext";

function AppContent({ socket, setToken }) {
  const { projects, servers, terminals } = useAppContext();
  const [currentView, setCurrentView] = useState("overview");
  const [isServerLocked, setIsServerLocked] = useState(true);
  const [activeTerminalId, setActiveTerminalId] = useState(null);

  const handleConnect = (terminalId) => {
    setActiveTerminalId(terminalId);
    setIsServerLocked(false); 
    setCurrentView("terminal");
  };

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return undefined;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // Removed socket.disconnect() from here so child doesn't kill it
    };
  }, [socket]);

  return (
      <div className="flex h-screen w-full bg-mesh overflow-hidden font-sans text-slate-200 selection:bg-primary-500/30">
        <SessionSidebar
          projects={projects}
          servers={servers}
          terminals={terminals}
          onSwitch={handleConnect}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        <main className="flex-1 flex flex-col h-full relative z-0 min-w-0 pb-[4.5rem] lg:pb-0">
          <header className="flex items-center justify-between px-4 py-4 bg-slate-900/30 backdrop-blur-md border-b border-white/5 pl-14 lg:pl-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse-glow shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`}
              />
              <span className="font-mono text-xs tracking-widest text-slate-200 font-bold uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {connected ? "LINK ESTABLISHED" : "LINK SEVERED"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setToken("")}
              className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 shadow-sm"
            >
              <LogOut size={14} />
              DISCONNECT
            </button>
          </header>

          <div className="flex-1 relative overflow-hidden bg-transparent">
            {/* Subtle grid background overlay */}
            <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />

            {["overview", "projects", "servers"].includes(currentView) ? (
              <div className="absolute inset-0 z-10 flex flex-col">
                <Overview defaultTab={currentView === "overview" ? "servers" : currentView} />
              </div>
            ) : currentView === "workspace" ? (
              <div className="absolute inset-0 z-10 flex flex-col">
                <Workspace />
              </div>
            ) : currentView === "users" ? (
              <div className="absolute inset-0 z-10 flex flex-col">
                <Users />
              </div>
            ) : currentView === "activity" ? (
              <div className="absolute inset-0 z-10 flex flex-col">
                <ActivityLog />
              </div>
            ) : currentView === "terminal" ? (
              <div className="absolute inset-0 z-10 p-3 lg:p-6 pb-0">
                <div className="w-full h-full rounded-t-2xl border border-white/10 border-b-0 glass-panel-premium overflow-hidden relative flex flex-col mt-2">
                  <div className="flex-1 p-2 pb-14 sm:pb-4 overflow-hidden relative">
                    {isServerLocked && (
                      <TerminalLock 
                        serverName="Agent Session"
                        onUnlock={() => setIsServerLocked(false)} 
                      />
                    )}
                    {activeTerminalId && <TerminalView socket={socket} terminalId={activeTerminalId} />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 font-mono">
                Component Not Found
              </div>
            )}
          </div>

          {/* Floating Virtual Keyboard for Mobile */}
          {currentView === "terminal" && activeTerminalId && !isServerLocked && (
            <div className="absolute bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 w-[95%] sm:w-auto max-w-lg z-30">
              <VirtualKeyboard
                onSend={(data) => socket?.emit("terminal:input", { terminalId: activeTerminalId, data })}
              />
            </div>
          )}

          {/* Mobile Bottom Navigation */}
          <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </main>
      </div>
  );
}

function App() {
  const [token, setToken] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setTimeout(() => setSocket(null), 0);
      return;
    }
    const newSocket = createSocket(token);
    requestAnimationFrame(() => {
      setSocket(newSocket);
    });
  }, [token]);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    }
  }, [socket]);

  if (!token) {
    return <LockScreen onUnlock={setToken} />;
  }

  return (
    <AppProvider socket={socket}>
      <AppContent socket={socket} setToken={setToken} />
    </AppProvider>
  );
}

export default App;
