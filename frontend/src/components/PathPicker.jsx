import React, { useState, useEffect } from "react";
import { Folder, ChevronRight, ChevronDown, CheckCircle2, Loader2, Home, FolderPlus } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function PickerNode({ node, serverId, level, onSelectPath, selectedPath, fsList }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-expand if the selected path is inside this node
  useEffect(() => {
    if (selectedPath && selectedPath.startsWith(node.path) && selectedPath !== node.path) {
      if (!isOpen) {
        setIsOpen(true);
        loadChildren();
      }
    }
  }, [selectedPath]);

  const loadChildren = async () => {
    if (children) return;
    setLoading(true);
    try {
      const res = await fsList(serverId, node.path);
      // Only show directories for picking project paths
      setChildren(res.files ? res.files.filter(f => f.isDirectory) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      loadChildren();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelectPath(node.path);
  };

  const isSelected = selectedPath === node.path;

  return (
    <div className="select-none">
      <div 
        onClick={handleSelect}
        className={`flex items-center py-1.5 px-2 cursor-pointer rounded transition-colors ${isSelected ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-white/5 text-slate-300'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div 
          onClick={toggleOpen} 
          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white mr-1 cursor-pointer"
        >
           {loading ? <Loader2 size={12} className="animate-spin" /> : (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </div>
        <Folder size={14} className={isSelected ? 'text-primary-400 mr-2' : 'text-blue-500 mr-2'} />
        <span className="text-xs font-mono truncate flex-1">{node.name}</span>
        {isSelected && <CheckCircle2 size={14} className="text-primary-400 ml-2" />}
      </div>

      {isOpen && children && (
        <div>
          {children.length === 0 ? (
            <div className="text-[10px] items-center font-mono text-slate-600 py-1" style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}>
              [Empty string]
            </div>
          ) : (
            children.map(child => (
               <PickerNode 
                 key={child.path} 
                 node={child} 
                 serverId={serverId} 
                 level={level + 1} 
                 onSelectPath={onSelectPath}
                 selectedPath={selectedPath}
                 fsList={fsList}
               />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PathPicker({ serverId, currentPath, onSelectPath }) {
  const { fsList } = useAppContext();
  const [rootNode, setRootNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoot = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass empty dirPath to get home directory
      const res = await fsList(serverId, "");
      // Construct a pseudo-root node based on the returned path
      const rootPath = res.path;
      // Get the last part of the path as name, or / if it's root
      const name = rootPath === '/' ? '/' : rootPath.split(/[\/\\]/).pop() || rootPath;
      
      const pseudoRoot = {
        name: name,
        path: rootPath,
        isDirectory: true
      };

      setRootNode(pseudoRoot);
      // Auto-select root if nothing is selected
      if (!currentPath) {
        onSelectPath(rootPath);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoot();
  }, [serverId]);

  const { fsMkdir } = useAppContext();
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!currentPath) return;
    const name = window.prompt("New folder name:");
    if (!name) return;
    const isWin = currentPath.includes('\\');
    const separator = isWin ? '\\' : '/';
    const newPath = currentPath.endsWith(separator) ? `${currentPath}${name}` : `${currentPath}${separator}${name}`;
    
    try {
      await fsMkdir(serverId, newPath);
      onSelectPath(newPath); // This will trigger PickerNode auto-expand
    } catch (err) {
      alert("Error creating folder: " + err.message);
    }
  };

  return (
    <div className="border border-white/10 rounded-lg bg-slate-900/80 overflow-hidden flex flex-col h-48">
      <div className="bg-slate-900 border-b border-white/5 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Home size={12} />
          <span>Server File Browser</span>
        </div>
        <button type="button" onClick={handleCreateFolder} className="text-slate-400 hover:text-white transition-colors" title="New Folder">
          <FolderPlus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {loading && <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-500" size={20} /></div>}
        {error && <div className="p-4 text-xs font-mono text-red-400 text-center">{error}</div>}
        
        {!loading && !error && rootNode && (
          <PickerNode 
            node={rootNode} 
            serverId={serverId} 
            level={0} 
            onSelectPath={onSelectPath}
            selectedPath={currentPath}
            fsList={fsList}
          />
        )}
      </div>
    </div>
  );
}
