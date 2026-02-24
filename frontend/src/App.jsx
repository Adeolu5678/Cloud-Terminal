import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
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

const OVERVIEW_TABS = ["overview", "projects", "servers"];

function AppContent({ socket }) {
  const { projects, servers, terminals, isConnected } = useAppContext();
  const [currentView, setCurrentView] = useState("overview");
  const [isServerLocked, setIsServerLocked] = useState(true);
  const [activeTerminalId, setActiveTerminalId] = useState(null);
  
  const { signOut } = useAuth();

  const handleConnect = (terminalId) => {
    if (activeTerminalId !== terminalId) {
      setIsServerLocked(true);
    }
    setActiveTerminalId(terminalId);
    setCurrentView("terminal");
  };

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
                className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse-glow shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`}
              />
              <span className="font-mono text-xs tracking-widest text-slate-200 font-bold uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {isConnected ? "LINK ESTABLISHED" : "LINK SEVERED"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="flex lg:hidden items-center gap-2 text-xs font-mono text-slate-300 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 shadow-sm"
            >
              <LogOut size={14} />
              DISCONNECT
            </button>
          </header>

          <div className="flex-1 relative overflow-hidden bg-transparent">
            {/* Subtle grid background overlay */}
            <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzQxNTUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />

            {OVERVIEW_TABS.includes(currentView) ? (
              <div className="absolute inset-0 z-10 flex flex-col">
                <Overview 
                  defaultTab={currentView === "overview" ? "servers" : currentView} 
                  onConnectTerminal={handleConnect} 
                />
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

          {/* Reconnection Overlay */}
          {!isConnected && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md pointer-events-auto">
              <div className="flex flex-col items-center gap-4 p-8 glass-panel-premium rounded-3xl text-center border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                </div>
                <h2 className="text-2xl font-bold font-mono text-slate-100 tracking-widest text-shadow-glow-red">LINK SEVERED</h2>
                <p className="text-sm font-mono text-slate-400">Attempting to re-establish secure tunnel to base...</p>
              </div>
            </div>
          )}
        </main>
      </div>
  );
}

function AuthenticatedView() {
  const { getToken } = useAuth();
  const [token, setToken] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    async function initSocket() {
      try {
        const jwt = await getToken();
        if (!jwt) return;
        setToken(jwt);
        const newSocket = createSocket(jwt);
        requestAnimationFrame(() => {
          setSocket(newSocket);
        });
      } catch(err) {
        console.error("Failed to fetch clerk token:", err);
      }
    }
    initSocket();
  }, [getToken]);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    }
  }, [socket]);

  if (!token || !socket) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900 text-primary-400 font-mono text-sm tracking-widest animate-pulse">
        ESTABLISHING SECURE TUNNEL...
      </div>
    );
  }

  return (
    <AppProvider socket={socket}>
      <AppContent socket={socket} />
    </AppProvider>
  );
}

function App() {
  return (
    <>
      <SignedOut>
        <LockScreen />
      </SignedOut>
      <SignedIn>
        <AuthenticatedView />
      </SignedIn>
    </>
  );
}

export default App;
