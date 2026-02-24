import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FileText, FileCode, Search, RefreshCw, FolderPlus, FilePlus, Edit2, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function FileIcon({ name, isDirectory, isOpen }) {
  if (isDirectory) {
    return isOpen ? <Folder className="text-blue-400" size={16} /> : <Folder className="text-blue-500" size={16} />;
  }
  if (name.endsWith(".js") || name.endsWith(".jsx") || name.endsWith(".ts")) return <FileCode className="text-yellow-400" size={16} />;
  if (name.endsWith(".json")) return <FileCode className="text-green-400" size={16} />;
  if (name.endsWith(".md") || name.endsWith(".txt")) return <FileText className="text-slate-400" size={16} />;
  return <File className="text-slate-500" size={16} />;
}

function FileNode({ node, serverId, level, onSelectFile, onDelete, onRename, onCreateResource, onRefresh }) {
  const { fsList } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleOpen = async () => {
    if (!node.isDirectory) {
      onSelectFile(node);
      return;
    }

    if (!isOpen && !children) {
      setLoading(true);
      try {
        const res = await fsList(serverId, node.path);
        setChildren(res.files || []);
      } catch (err) {
        console.error("Failed to load directory", err);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    if (!node.isDirectory || !isOpen) return;
    setLoading(true);
    try {
      const res = await fsList(serverId, node.path);
      setChildren(res.files || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={toggleOpen}
        className="flex items-center justify-between py-1 px-2 hover:bg-white/10 cursor-pointer rounded transition-colors group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-4 flex justify-center text-slate-500">
            {node.isDirectory && (
              isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </span>
          <FileIcon name={node.name} isDirectory={node.isDirectory} isOpen={isOpen} />
          <span className={`text-sm font-mono truncate ${node.isDirectory ? 'text-slate-200' : 'text-slate-300'}`}>
            {node.name}
          </span>
        </div>
        
        {/* Hover Actions */}
        <div className="hidden group-hover:flex items-center gap-1 pr-2">
          {node.isDirectory && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onCreateResource(node.path, false, handleRefresh); }} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10" title="New File"><FilePlus size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); onCreateResource(node.path, true, handleRefresh); }} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10" title="New Folder"><FolderPlus size={12} /></button>
            </>
          )}
          {node.isDirectory && isOpen && (
            <button onClick={handleRefresh} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10" title="Refresh">
              <RefreshCw size={12} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRename(node, onRefresh); }} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10" title="Rename">
            <Edit2 size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(node, onRefresh); }} className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-white/10" title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {loading && node.isDirectory && isOpen && (
        <div className="text-xs font-mono text-slate-500 py-1" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
          Loading...
        </div>
      )}

      {isOpen && children && (
        <div>
          {children.length === 0 ? (
            <div className="text-xs font-mono text-slate-600 py-1" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
              [Empty string]
            </div>
          ) : (
            children.map(child => (
               <FileNode 
                 key={child.path} 
                 node={child} 
                 serverId={serverId} 
                 level={level + 1} 
                 onSelectFile={onSelectFile}
                 onDelete={onDelete}
                 onRename={onRename}
                 onCreateResource={onCreateResource}
                 onRefresh={handleRefresh}
               />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ project, onSelectFile }) {
  const { fsList, fsDelete, fsRename, fsWrite, fsMkdir } = useAppContext();
  const [rootFiles, setRootFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const serverId = project.serverId || 'local';
  const rootPath = project.path;

  const loadRoot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fsList(serverId, rootPath);
      setRootFiles(res.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project?.id) {
      loadRoot();
    }
  }, [project?.id, serverId, rootPath]);

  const handleDelete = async (node, onSuccess) => {
    if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
      try {
        await fsDelete(serverId, node.path);
        if (onSuccess) onSuccess();
      } catch (err) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const handleRename = async (node, onSuccess) => {
    const newName = window.prompt("Enter new name:", node.name);
    if (!newName || newName === node.name) return;
    
    // Robust path handling utilizing standard string manipulation for base paths
    const pathParts = node.path.split(/[\\/]/);
    pathParts.pop(); // Remove old name
    pathParts.push(newName); // Append new name
    const newPath = pathParts.join(node.path.includes('\\') ? '\\' : '/');

    try {
      await fsRename(serverId, node.path, newPath);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Failed to rename: " + err.message);
    }
  };

  const handleCreateResource = async (basePath, isDir, onSuccess) => {
    const name = window.prompt(`New ${isDir ? 'Folder' : 'File'} Name:`);
    if (!name) return;

    const separator = basePath.includes('\\') ? '\\' : '/';
    // Ensure we do not add a double slash if basePath ends with a slash (can happen at roots)
    const targetPath = basePath.endsWith(separator) ? `${basePath}${name}` : `${basePath}${separator}${name}`;
    
    try {
      if (isDir) {
        await fsMkdir(serverId, targetPath);
      } else {
        await fsWrite(serverId, targetPath, "");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!project) return null;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-r border-[#333333] text-sm custom-scrollbar">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-4 py-2 uppercase text-xs font-bold text-slate-400 tracking-wider">
        <span>Explorer: {project.name}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleCreateResource(rootPath, false, loadRoot)} className="hover:text-white transition-colors" title="New File"><FilePlus size={14}/></button>
          <button onClick={() => handleCreateResource(rootPath, true, loadRoot)} className="hover:text-white transition-colors" title="New Folder"><FolderPlus size={14}/></button>
          <button onClick={loadRoot} className="hover:text-white transition-colors" title="Refresh"><RefreshCw size={14}/></button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto pt-2 pb-4">
        {loading && <div className="px-4 text-slate-500 font-mono text-xs">Loading workspace...</div>}
        {error && <div className="px-4 text-red-400 font-mono text-xs">{error}</div>}
        
        {!loading && !error && rootFiles.map((node) => (
          <FileNode 
            key={node.path} 
            node={node} 
            serverId={serverId} 
            level={0} 
            onSelectFile={onSelectFile}
            onDelete={handleDelete}
            onRename={handleRename}
            onCreateResource={handleCreateResource}
            onRefresh={loadRoot}
          />
        ))}
      </div>
    </div>
  );
}
