import { useState, useEffect } from "react";
import { LayoutGrid, TerminalSquare, Folder, LayoutTemplate, Activity, Users, FileText, Settings, Plus, UserCircle, LogOut, MoreVertical, Edit2, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { isMobileDevice } from "../utils/device";
import { useEditableNode } from "../hooks/useEditableNode";
import { useUser, useClerk } from "@clerk/clerk-react";
import SettingsModal from "./SettingsModal";

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
  // sidebar is always static — no mobile toggle needed
  const [dropdownSessionId, setDropdownSessionId] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  // Bug 2 fix: Use a data-attribute to identify dropdown triggers instead of
  // a single ref (which can only point to one element across a .map()).
  // Any mousedown on an element WITHOUT [data-session-dropdown] closes the menu.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      setTimeout(() => {
        if (!e.target.closest('[data-session-dropdown]')) {
          setDropdownSessionId(null);
        }
      }, 0);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const { 
    editingId: editingSessionId, 
    editingName: editingSessionName, 
    setEditingName: setEditingSessionName, 
    nameRef: editingNameRef, 
    startEditing: startEditingRaw, 
    saveEditing: saveEditedSession, 
    handleKeyDown: handleTabKeyDown 
  } = useEditableNode((id, name) => {
    if (socket) socket.emit("terminal:rename", { terminalId: id, name });
  });
  const handleNav = (id) => {
    setCurrentView(id);
  };

  return (
    <>
      {/* Sidebar — always static, fixed width, never slides */}
      <aside
        className="hidden lg:flex w-64 flex-shrink-0 h-full glass-panel-premium flex-col border-l-0 border-y-0 overflow-hidden"
      >
        <div className="flex items-center p-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-400 shadow-[0_0_15px_rgba(56,189,248,0.2)] flex-shrink-0">
               <TerminalSquare size={16} />
            </div>
            <span className="font-mono font-bold tracking-wide text-slate-100 truncate">Cloud Terminal</span>
          </div>
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-mono transition-all ${
                      isActive
                        ? "bg-primary-500/10 text-primary-300 shadow-[inset_0_0_10px_rgba(56,189,248,0.1)]"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
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
              let groupName = isMobileDevice() ? "My PC (Host Server)" : "Host PC (Local)";
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
                              <li key={t.id} className="relative flex items-center group hover:bg-slate-800/60 rounded-xl transition-all border border-transparent hover:border-white/5">
                              <button
                                  type="button"
                                  onClick={() => onSwitch(t.id)}
                                  className="flex-1 flex items-center justify-between px-3 py-2 text-left text-sm font-mono text-slate-300 min-w-0 overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] flex-shrink-0" />
                                    
                                    {editingSessionId === t.id ? (
                                      <input 
                                        data-session-dropdown
                                        autoFocus
                                        defaultValue={editingSessionName}
                                        onChange={e => { editingNameRef.current = e.target.value; setEditingSessionName(e.target.value); }}
                                        onBlur={saveEditedSession}
                                        onKeyDown={handleTabKeyDown}
                                        onClick={e => e.stopPropagation()}
                                        className="flex-1 bg-slate-800 border border-primary-500/50 rounded px-1 text-xs font-mono text-white focus:outline-none w-full min-w-0"
                                      />
                                    ) : (
                                      <span className="truncate block max-w-[120px]" title={t.name}>{t.name}</span>
                                    )}
                                  </div>
                                </button>
                                
                                <div data-session-dropdown className="relative flex items-center pr-2">
                                  <button 
                                    data-session-dropdown
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (dropdownSessionId === t.id) {
                                        setDropdownSessionId(null);
                                      } else {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                        setDropdownSessionId(t.id);
                                      }
                                    }}
                                    className={`p-1 rounded transition-colors ${dropdownSessionId === t.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}
                                  >
                                    <MoreVertical size={14} />
                                  </button>
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
                    onClick={() => {
                      if (link.id === "settings") setShowSettings(true);
                    }}
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
          <div 
            role="button"
            tabIndex={0}
            className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => signOut()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); signOut(); } }}
            title="Log out"
          >
            <div className="flex items-center gap-3 min-w-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-primary-400 transition-colors flex-shrink-0">
                   <UserCircle size={20} />
                </div>
              )}
              <span className="font-mono text-sm text-slate-200 truncate pr-2">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User'}
              </span>
            </div>
            <LogOut size={16} className="text-slate-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
          </div>
        </div>
      </aside>
      {/* Fixed-position dropdown: escapes overflow-y-auto clipping on the sidebar */}
      {dropdownSessionId && (
        <div
          data-session-dropdown
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
          className="w-44 bg-[#252526] border border-[#444] rounded-lg shadow-2xl py-1 overflow-hidden"
        >
          {(() => {
            const t = terminals.find(x => x.id === dropdownSessionId);
            if (!t) return null;
            return (
              <>
                <div className="px-3 py-2 border-b border-[#333] text-[10px] font-mono text-slate-500 uppercase tracking-widest truncate">{t.name || 'Terminal'}</div>
                <button
                  data-session-dropdown
                  onClick={(e) => {
                    e.stopPropagation();
                    const initialName = t.name || 'Terminal';
                    startEditingRaw(t.id, initialName);
                    setDropdownSessionId(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-slate-300 hover:bg-[#007acc] hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={12}/> Rename
                </button>
                <button
                  data-session-dropdown
                  onClick={(e) => { e.stopPropagation(); killTerminal(t.id); setDropdownSessionId(null); }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-slate-300 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={12}/> Delete
                </button>
              </>
            );
          })()}
        </div>
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default SessionSidebar;
