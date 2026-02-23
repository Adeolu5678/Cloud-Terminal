import React, { useState, useEffect, useCallback } from "react";
import { Folder, Plus, X, Terminal as TerminalIcon, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { FileExplorer } from "./FileExplorer";
import TerminalView from "./TerminalView";
import { EditorView } from "./EditorView";
import { useEditableNode } from "../hooks/useEditableNode";

function Workspace() {
  const { projects, terminals, createTerminal, killTerminal, socket } = useAppContext();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null); // 'term-id' or 'file-path'
  const [openFiles, setOpenFiles] = useState([]); // [{ name, path, isDirty }]
  const [mountedTabs, setMountedTabs] = useState(new Set());
  const [dropdownTabId, setDropdownTabId] = useState(null);

  // Tab dropdown outside-click: data-attribute approach (same as SessionSidebar)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Small timeout ensures the event propagates before closing
      setTimeout(() => {
        if (!e.target.closest('[data-tab-dropdown]')) {
          setDropdownTabId(null);
        }
      }, 0);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Terminal tabs just for this workspace/project
  const projectTerminals = terminals.filter(t => t.refId === activeProjectId && t.type === 'project');

  useEffect(() => {
    // If we have an active project but no active tab, auto-select the first terminal if exists
    if (activeProjectId && projectTerminals.length > 0 && !activeTabId) {
      setTimeout(() => setActiveTabId(`term-${projectTerminals[0].id}`), 0);
    } else if (projectTerminals.length === 0 && openFiles.length === 0) {
      setTimeout(() => setActiveTabId(null), 0);
    }
  }, [activeProjectId, projectTerminals.length, activeTabId, openFiles.length, projectTerminals]);

  useEffect(() => {
    if (activeTabId) {
      setTimeout(() => {
        setMountedTabs((prev) => { const s = new Set(prev); s.add(activeTabId); return s; });
      }, 0);
    }
  }, [activeTabId]);

  const handleAddTerminal = async () => {
    if (!activeProjectId) return;
    try {
      const newId = await createTerminal("project", activeProjectId);
      setActiveTabId(`term-${newId}`);
    } catch (err) {
      alert("Failed to spawn terminal: " + err.message);
    }
  };

  const handleCloseTerminal = (e, id) => {
    e.stopPropagation();
    killTerminal(id);
    if (activeTabId === `term-${id}`) {
      setTimeout(() => setActiveTabId(null), 0); // will auto-select something else via effect
    }
  };

  const handleOpenFile = (node) => {
    if (!openFiles.find(f => f.path === node.path)) {
      setOpenFiles([...openFiles, { ...node, isDirty: false }]);
    }
    setActiveTabId(`file-${node.path}`);
  };

  const handleCloseFile = (e, path) => {
    e.stopPropagation();
    const file = openFiles.find(f => f.path === path);
    if (file && file.isDirty && !window.confirm(`Save changes to ${file.name}? Click Cancel to discard or OK to ignore and close anyway.`)) {
      return; // In reality we'd prompt Save/Discard/Cancel.
    }
    setOpenFiles(openFiles.filter(f => f.path !== path));
    if (activeTabId === `file-${path}`) {
      setTimeout(() => setActiveTabId(null), 0);
    }
  };

  const handleFileChange = (path, isDirty) => {
    setOpenFiles(files => files.map(f => f.path === path ? { ...f, isDirty } : f));
  };

  const { 
    editingId: editingTabId, 
    editingName: editingTabName, 
    setEditingName: setEditingTabName, 
    nameRef: editingTabNameRef, 
    startEditing: startEditingTabRaw, 
    saveEditing: saveEditedTab, 
    handleKeyDown: handleTabKeyDown 
  } = useEditableNode((id, name) => {
    if (socket) socket.emit("terminal:rename", { terminalId: id, name });
  });

  const startEditingTab = useCallback((e, t) => {
    e.stopPropagation();
    startEditingTabRaw(t.id, t.name || 'Terminal');
  }, [startEditingTabRaw]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Folder size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-mono text-slate-300 mb-2">Workspace Select</h2>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          Select a project from the list below to open it in the VS Code style workspace editor.
        </p>
        <div className="grid gap-3 w-full max-w-lg">
          {projects.map(p => (
            <button 
              key={p.id}
              onClick={() => setActiveProjectId(p.id)}
              className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><Folder size={20}/></div>
              <div>
                <div className="font-bold text-slate-200">{p.name}</div>
                <div className="font-mono text-xs text-slate-500">{p.path}</div>
              </div>
            </button>
          ))}
          {projects.length === 0 && (
            <div className="text-center text-slate-500 font-mono text-xs py-4">No projects available.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden bg-[#1e1e1e]">
      
      {/* LEFT PANE: File Explorer */}
      <div className="w-64 flex-shrink-0 border-r border-[#333333] flex flex-col">
        <div className="p-2 border-b border-[#333333] flex items-center justify-between">
          <button 
            onClick={() => setActiveProjectId(null)}
            className="text-[10px] font-mono uppercase bg-[#333333] hover:bg-[#444] text-slate-300 px-2 py-1 rounded transition-colors"
          >
            ← Back
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
           <FileExplorer project={activeProject} onSelectFile={handleOpenFile} />
        </div>
      </div>

      {/* RIGHT PANE: Terminals & Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        
        {/* Top Tabs Bar */}
        <div className="flex flex-wrap items-end bg-[#252526] border-b border-[#333333] select-none">
          {/* File Tabs */}
          {openFiles.map(f => (
            <div 
              key={f.path}
              role="button" // Added role="button"
              tabIndex={0} // Added tabIndex={0}
              onClick={() => setActiveTabId(`file-${f.path}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTabId(`file-${f.path}`); } }}
              className={`flex items-center gap-2 group px-3 py-1.5 border-r border-[#333333] border-t-2 cursor-pointer min-w-[120px] max-w-[200px] h-full ${activeTabId === `file-${f.path}` ? 'bg-[#1e1e1e] border-t-[#007acc] text-white' : 'bg-[#2d2d2d] border-t-transparent text-slate-400 hover:bg-[#2d2d2d]/80'}`}
            >
               <span className="text-xs font-mono truncate flex-1 select-none pr-2">
                 {f.isDirty ? <span className="text-[#e2c08d] mr-1">•</span> : null}
                 {f.name}
               </span>
               <button 
                 onClick={(e) => handleCloseFile(e, f.path)}
                 className={`p-0.5 rounded hover:bg-white/10 ${activeTabId === `file-${f.path}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
               >
                 <X size={12} />
               </button>
            </div>
          ))}

          {/* Terminal Tabs */}
          {projectTerminals.map(t => (
            <div 
              key={t.id}
              role="button" // Added role="button"
              tabIndex={0} // Added tabIndex={0}
              onClick={() => setActiveTabId(`term-${t.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTabId(`term-${t.id}`); } }}
              onDoubleClick={(e) => startEditingTab(e, t)}
              className={`flex items-center gap-2 group/tab px-3 py-1.5 border-r border-[#333333] border-t-2 cursor-pointer min-w-[120px] max-w-[200px] h-full ${activeTabId === `term-${t.id}` ? 'bg-[#1e1e1e] border-t-[#007acc] text-white' : 'bg-[#2d2d2d] border-t-transparent text-slate-400 hover:bg-[#2d2d2d]/80'}`}
            >
               <TerminalIcon size={14} className={activeTabId === `term-${t.id}` ? 'text-[#007acc]' : 'text-slate-500'} />
               
                 {editingTabId === t.id ? (
                   <input 
                      autoFocus
                      defaultValue={editingTabName}
                      onChange={e => { editingTabNameRef.current = e.target.value; setEditingTabName(e.target.value); }}
                      onBlur={saveEditedTab}
                      onKeyDown={handleTabKeyDown}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 bg-[#1a1a1a] border border-[#007acc]/60 rounded px-1 text-xs font-mono text-white focus:outline-none w-full min-w-0"
                    />
                 ) : (
                   <span className="text-xs font-mono truncate flex-1 select-none pr-2">{t.name || 'Terminal'}</span>
                 )}

                 <div data-tab-dropdown className="relative flex items-center">
                   <button data-tab-dropdown onClick={(e) => { e.stopPropagation(); setDropdownTabId(dropdownTabId === t.id ? null : t.id); }} // Changed onMouseDown to onClick
                     className={`p-0.5 rounded transition-colors ${activeTabId === `term-${t.id}` || dropdownTabId === t.id ? 'opacity-100 hover:bg-white/10' : 'opacity-0 group-hover/tab:opacity-100 text-slate-500 hover:text-white hover:bg-white/10'}`} // Updated class for group-hover
                   >
                     <MoreVertical size={14} />
                   </button>
                   {dropdownTabId === t.id && (
                     <div data-tab-dropdown className="absolute right-0 top-full mt-1 w-32 bg-[#252526] border border-[#333333] rounded-md shadow-xl py-1 z-50">
                       <button data-tab-dropdown onClick={(e) => { e.stopPropagation(); startEditingTab(e, t); setDropdownTabId(null); }} className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-[#007acc] hover:text-white flex items-center gap-2">
                         <Edit2 size={12}/> Rename
                       </button>
                       <button data-tab-dropdown onClick={(e) => { e.stopPropagation(); handleCloseTerminal(e, t.id); setDropdownTabId(null); }} className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-red-500 hover:text-white flex items-center gap-2">
                         <Trash2 size={12}/> Delete
                       </button>
                     </div>
                   )}
                 </div>
            </div>
          ))}
          <button 
            onClick={handleAddTerminal}
            className="p-2 text-slate-400 hover:text-white transition-colors h-full flex items-center"
            title="New Terminal"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2 overflow-hidden flex flex-col bg-[#1e1e1e]">
          {projectTerminals.length === 0 && openFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-sm gap-4">
              <TerminalIcon size={48} className="opacity-20" />
              <span>No active editor or terminal</span>
              <button 
                onClick={handleAddTerminal}
                className="px-4 py-2 bg-[#007acc] hover:bg-[#006bb3] text-white rounded transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> Create Terminal
              </button>
            </div>
          ) : (
            <div className="flex-1 border border-[#333333] rounded overflow-hidden flex flex-col bg-[#1e1e1e] relative">
              {/* Render all files hidden or visible using pure display (to preserve state) */}
              {openFiles.map(f => {
                const tabId = `file-${f.path}`;
                const isMounted = mountedTabs.has(tabId) || activeTabId === tabId;
                if (!isMounted) return null;
                return (
                  <div 
                    key={f.path} 
                    className="flex-1 w-full h-full min-h-0 relative" 
                    style={{ 
                      display: activeTabId === tabId ? 'block' : 'none'
                    }}
                  >
                    <EditorView 
                      fileNode={f} 
                      serverId={activeProject.serverId || 'local'} 
                      onContentChange={(isDirty) => handleFileChange(f.path, isDirty)}
                    />
                  </div>
                );
              })}
              {/* Conditionally render only the active terminal (unmount others, history is kept in backend) */}
              {projectTerminals.map(t => {
                const tabId = `term-${t.id}`;
                if (activeTabId !== tabId) return null;
                
                return (
                  // FIX (Bug 1 — xterm layout): The terminal wrapper must be
                  // `relative` (or establish a positioned stacking context) so
                  // TerminalView's inner `absolute inset-0` div can measure its
                  // actual pixel bounds. Previously `flex-1 h-full min-h-0`
                  // could collapse to zero height inside the outer flex column
                  // before the browser committed layout, causing xterm to
                  // initialise against a 0×0 container.
                  <div 
                    key={t.id} 
                    className="absolute inset-0"
                  >
                    <TerminalView socket={socket} terminalId={t.id} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>

    </div>
  );
}

export default Workspace;
