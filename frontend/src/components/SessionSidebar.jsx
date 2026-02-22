import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutGrid, TerminalSquare, Folder, LayoutTemplate, Activity, Users, FileText, Settings, Plus, UserCircle, LogOut, MoreVertical, Edit2, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "../context/AppContext";

const MAIN_LINKS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "servers", label: "Servers", icon: TerminalSquare },
  { id: "workspace", label: "Workspace", icon: LayoutTemplate },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "users", label: "User Management", icon: Users },
];

const BOTTOM_LINKS = [
  { id: "docs", label: "Documentation", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

function SessionSidebar({ projects, servers, terminals, onSwitch, currentView, setCurrentView }) {
  const { killTerminal, socket } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownSessionId, setDropdownSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    const closeDropdown = () => setDropdownSessionId(null);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  const saveEditedSession = () => {
    if (editingSessionId && socket) {
      socket.emit("terminal:rename", { terminalId: editingSessionId, name: editingSessionName });
    }
    setEditingSessionId(null);
  };
  
  const handleTabKeyDown = (e) => {
    if (e.key === 'Enter') saveEditedSession();
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNav = (id) => {
    setCurrentView(id);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button (Floating) */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed top-3 left-3 z-50 p-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-lg text-slate-200 hover:text-primary-400 hover:bg-slate-800/60 transition-all shadow-lg lg:hidden"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <Motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : 0 }} 
        className={clsx(
          "fixed top-0 left-0 h-full w-72 glass-panel-premium z-50 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:w-64 border-l-0 border-y-0 hidden lg:flex",
          isOpen ? "!translate-x-0 !flex" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
               <TerminalSquare size={16} />
            </div>
            <span className="font-mono font-bold tracking-wide text-slate-100">Cloud Terminal</span>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-dark-700 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-white/5">
          <button 
            onClick={() => handleNav("servers")}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-xl font-mono text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-primary-400/50">
            <Plus size={16} /> New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar space-y-6">
          <ul className="space-y-1">
            {MAIN_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id;
              const isProjects = link.id === "projects";
              const isServers = link.id === "servers";
              const count = isProjects ? projects?.length : (isServers ? servers?.length : null);

              return (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => handleNav(link.id)}
                    className={clsx(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-mono transition-all",
                      isActive
                        ? "bg-primary-500/10 text-primary-300 shadow-[inset_0_0_10px_rgba(56,189,248,0.1)]"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={isActive ? "text-primary-400" : "text-slate-500"} />
                      {link.label}
                    </div>
                    {count !== null && count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/5 text-[10px] text-slate-400">
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {terminals && terminals.length > 0 && (() => {
            // Group terminals by project or server
            const groupedTerminals = {};
            terminals.forEach(t => {
              let groupName = "Global / Local";
              if (t.type === 'project') {
                const proj = projects?.find(p => p.id === t.refId);
                groupName = proj ? proj.name : "Unknown Project";
              } else if (t.type === 'server') {
                const srv = servers?.find(s => s.id === t.refId);
                groupName = srv ? srv.name : "Unknown Server";
              }
              if (!groupedTerminals[groupName]) groupedTerminals[groupName] = [];
              groupedTerminals[groupName].push(t);
            });

            return (
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Active Sessions</h4>
                <ul className="space-y-4">
                  {Object.entries(groupedTerminals).map(([groupName, groupTerms]) => {
                    const isCollapsed = collapsedGroups[groupName];
                    return (
                      <li key={groupName} className="space-y-1">
                        <button 
                          onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                          className="w-full text-left px-3 py-1 text-[10px] font-mono font-semibold text-primary-400/80 uppercase tracking-wider flex items-center justify-between hover:bg-slate-800/40 rounded transition-colors"
                        >
                          <span>{groupName}</span>
                          <span className="text-slate-500 font-normal">
                             {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <ul className="space-y-1">
                            {groupTerms.map((t) => (
                              <li key={t.id} className="relative flex items-center group/item hover:bg-slate-800/60 rounded-xl transition-all border border-transparent hover:border-white/5">
                                <button
                                  type="button"
                                  onClick={() => onSwitch(t.id)}
                                  className="flex-1 flex items-center justify-between px-3 py-2 text-left text-sm font-mono text-slate-300"
                                >
                                  <div className="flex items-center gap-3 truncate">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    
                                    {editingSessionId === t.id ? (
                                      <input 
                                        autoFocus
                                        value={editingSessionName}
                                        onChange={e => setEditingSessionName(e.target.value)}
                                        onBlur={saveEditedSession}
                                        onKeyDown={handleTabKeyDown}
                                        onClick={e => e.stopPropagation()}
                                        className="flex-1 bg-transparent border-none text-xs font-mono text-white focus:outline-none w-full min-w-0"
                                      />
                                    ) : (
                                      <span className="truncate">{t.name}</span>
                                    )}
                                  </div>
                                </button>
                                
                                <div className="relative flex items-center px-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDropdownSessionId(dropdownSessionId === t.id ? null : t.id); }}
                                    className={`p-0.5 rounded hover:bg-white/10 ${dropdownSessionId === t.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
                                  >
                                    <MoreVertical size={14} className="text-slate-400 hover:text-white" />
                                  </button>
                                  {dropdownSessionId === t.id && (
                                    <div className="absolute left-full top-0 ml-1 w-32 bg-[#252526] border border-[#333333] rounded-md shadow-xl py-1 z-50">
                                      <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(t.id); setEditingSessionName(t.name || 'Terminal'); setDropdownSessionId(null); }} className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-[#007acc] hover:text-white flex items-center gap-2">
                                        <Edit2 size={12}/> Rename
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); killTerminal(t.id); setDropdownSessionId(null); }} className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-red-500 hover:text-white flex items-center gap-2">
                                        <Trash2 size={12}/> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })()}

          <ul className="space-y-1 pt-4 border-t border-white/5">
            {BOTTOM_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-mono text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 transition-all"
                  >
                    <Icon size={18} className="text-slate-500" />
                    {link.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/30">
          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-primary-400 transition-colors">
                 <UserCircle size={20} />
              </div>
              <span className="font-mono text-sm text-slate-200">admin</span>
            </div>
            <LogOut size={16} className="text-slate-600 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </Motion.aside>
    </>
  );
}

export default SessionSidebar;
