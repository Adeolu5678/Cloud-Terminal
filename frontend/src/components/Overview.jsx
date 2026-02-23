import { useState, useEffect } from "react";
import { Clock, Activity, Folder, Server as ServerIcon, Play, Plus, X, Edit2, Trash2, Home } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { PathPicker } from "./PathPicker";
import { isMobileDevice } from "../utils/device";

function Overview({ defaultTab = "servers" }) {
  const { 
    projects, servers, terminals, 
    addProject, addServer, editProject, editServer, removeProject, removeServer, createTerminal 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState(defaultTab);
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { type, data }
  const [selectedServerId, setSelectedServerId] = useState("local");

  const totalSessions = terminals.length;
  const activeNow = terminals.length;

  const handleConnect = async (type, refId) => {
    try {
      await createTerminal(type, refId);
    } catch (err) {
      alert("Failed to start terminal: " + err.message);
    }
  };

  const handleEdit = (type, data = null) => {
    setEditingItem({ type, data });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleSaveModal = async (type, data) => {
    try {
      if (type === "projects") {
        if (editingItem?.data) {
          await editProject(editingItem.data.id, data);
        } else {
          await addProject(data);
        }
      } else if (editingItem?.data) {
        await editServer(editingItem.data.id, data);
      } else {
        await addServer(data);
      }
      handleCloseModal();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const displayedProjects = projects.filter(p => (p.serverId || 'local') === selectedServerId);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-alert lg:p-8 pt-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Sessions" value={`>_ ${totalSessions}`} subtext="Running PTYs" />
          <MetricCard 
            title="Active Now" 
            value={<div className="flex items-center gap-2"><Activity size={24} className="text-green-500 animate-pulse" /><span>{activeNow}</span></div>}
            subtext={<div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-slate-800/50 w-fit text-slate-300"><Activity size={10} /> Running</div>}
          />
          <MetricCard 
            title="Total Projects" 
            value={<div className="flex items-center gap-2"><Folder size={24} className="text-blue-500" /><span>{projects.length}</span></div>}
            subtext="Across All Servers" 
          />
          <MetricCard 
            title="Total Servers" 
            value={<div className="flex items-center gap-2"><ServerIcon size={24} className="text-purple-500" /><span>{servers.length}</span></div>}
            subtext="SSH Environments" 
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab("servers")}
              className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors flex items-center justify-center gap-2 rounded-t-lg ${activeTab === 'servers' ? 'border-primary-500 text-slate-200 bg-slate-800/40' : 'border-transparent text-slate-500 hover:bg-slate-800/20 hover:text-slate-300'}`}>
              <ServerIcon size={16} /> Servers
            </button>
            <button 
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors flex items-center justify-center gap-2 rounded-t-lg ${activeTab === 'projects' ? 'border-primary-500 text-slate-200 bg-slate-800/40' : 'border-transparent text-slate-500 hover:bg-slate-800/20 hover:text-slate-300'}`}>
              <Folder size={16} /> Projects
            </button>
          </div>
          
          <button 
            onClick={() => handleEdit(activeTab)}
            className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors border border-primary-400/50 mb-2">
            <Plus size={14} /> ADD {activeTab === "projects" ? "PROJECT" : "SERVER"}
          </button>
        </div>

        {/* List Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
               <h2 className="text-lg font-bold text-slate-200 mt-2">Your {activeTab === "projects" ? "Projects" : "Servers"}</h2>
               <p className="text-sm text-slate-500 font-mono">
                 {activeTab === "projects" 
                   ? "Execute workspaces securely inside the selected environment" 
                   : "SSH remote connections - connect to your VPS securely"}
               </p>
            </div>
            {activeTab === "projects" && (
              <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-slate-900/50 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-white/5 shadow-inner">
                <span className="text-xs font-mono text-slate-400">Environment:</span>
                <select 
                  value={selectedServerId} 
                  onChange={e => setSelectedServerId(e.target.value)}
                  className="bg-transparent border-none text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
                >
                  <option value="local">{isMobileDevice() ? "My PC (Host Server)" : "Host PC (Local)"}</option>
                  {servers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.host})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="grid gap-4">
            {activeTab === "projects" && displayedProjects.length === 0 && (
              <EmptyState type="project" onAdd={() => handleEdit("projects")} />
            )}
            {activeTab === "projects" && displayedProjects.map((p) => (
              <ProjectCard 
                key={p.id} 
                project={p} 
                onConnect={() => handleConnect("project", p.id)}
                onEdit={() => handleEdit("projects", p)}
                onDelete={() => {
                  if (window.confirm("Delete project?")) removeProject(p.id)
                }}
              />
            ))}

            {activeTab === "servers" && servers.length === 0 && (
              <EmptyState type="server" onAdd={() => handleEdit("servers")} />
            )}
            {activeTab === "servers" && servers.map((s) => (
              <ServerCard 
                key={s.id} 
                server={s} 
                onConnect={() => handleConnect("server", s.id)}
                onEdit={() => handleEdit("servers", s)}
                onDelete={() => {
                  if (window.confirm("Delete server environment?")) removeServer(s.id)
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {showAddModal && (
        <AddModal 
          type={editingItem.type} 
          initialData={editingItem.data}
          servers={servers}
          onClose={handleCloseModal} 
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}

function EmptyState({ type, onAdd }) {
  return (
    <div className="p-8 text-center text-slate-500 font-mono text-sm border border-white/5 rounded-2xl border-dashed">
      No active {type}s found in this environment. <button onClick={onAdd} className="text-primary-400 hover:underline">Add a {type}</button> to get started.
    </div>
  )
}

function MetricCard({ title, value, subtext }) {
  return (
    <div className="glass-panel-premium border-b-0 border-x-white/5 p-5 flex flex-col justify-between h-32 rounded-2xl shadow-xl">
      <div className="font-mono text-xs text-slate-400 font-semibold tracking-wide uppercase">
        {title}
      </div>
      <div>
        <div className="text-3xl font-bold font-mono text-slate-100 tracking-tight flex items-center">
          {value}
        </div>
      </div>
      <div className="text-[11px] font-mono text-slate-500">
        {subtext}
      </div>
    </div>
  );
}

function ServerCard({ server, onConnect, onEdit, onDelete }) {
  return (
    <div className="glass-panel-premium p-4 md:p-5 rounded-2xl border-b-0 border-x-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary-500/30 group">
      <div className="flex items-start gap-4">
        <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
           <ServerIcon className="text-purple-400" size={20} />
        </div>
        <div>
           <h3 className="text-lg font-bold font-mono text-slate-100 mb-2">{server.name}</h3>
           <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] md:text-xs">
             <div className="px-2 py-1 rounded bg-slate-800 border border-white/5 text-slate-300">
               {server.user}@{server.host}:{server.port}
             </div>
           </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/5 rounded-lg transition-colors"><Edit2 size={12}/></button>
          <button onClick={onDelete} className="p-1.5 text-red-400/80 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"><Trash2 size={12}/></button>
        </div>
        <button 
           onClick={onConnect}
           className="px-4 py-2 sm:px-5 sm:py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-mono text-xs sm:text-sm tracking-wide shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all flex items-center gap-2 active:scale-95 border border-primary-400/50"
        >
          <Play size={14} fill="currentColor" /> Connect
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ project, onConnect, onEdit, onDelete }) {
  return (
    <div className="glass-panel-premium p-4 md:p-5 rounded-2xl border-b-0 border-x-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary-500/30 group">
      <div className="flex items-start gap-4">
        <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
           <Folder className="text-blue-400" size={20} />
        </div>
        <div>
           <h3 className="text-lg font-bold font-mono text-slate-100 mb-2">{project.name}</h3>
           <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] md:text-xs">
             <div className="px-2 py-1 rounded bg-slate-800 border border-white/5 text-slate-300 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
               {project.path}
             </div>
           </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/5 rounded-lg transition-colors"><Edit2 size={12}/></button>
          <button onClick={onDelete} className="p-1.5 text-red-400/80 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"><Trash2 size={12}/></button>
        </div>
        <button 
           onClick={onConnect}
           className="px-4 py-2 sm:px-5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-mono text-xs sm:text-sm tracking-wide transition-all flex items-center gap-2 active:scale-95 border border-white/10"
        >
          <Play size={14} fill="currentColor" /> Open Terminal
        </button>
      </div>
    </div>
  );
}

function AddModal({ type, initialData, servers, onClose, onSave }) {
  const [name, setName] = useState(initialData?.name || "");
  const [path, setPath] = useState(initialData?.path || "");
  const [serverId, setServerId] = useState(initialData?.serverId || "local");
  
  const [host, setHost] = useState(initialData?.host || "");
  const [user, setUser] = useState(initialData?.user || "root");
  const [password, setPassword] = useState(initialData?.password || "");
  const [port, setPort] = useState(initialData?.port ? String(initialData.port) : "22");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "projects") {
      onSave(type, { name, path, serverId });
    } else {
      onSave(type, { name, host, user, password, port });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel-premium rounded-2xl border-white/10 w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
          <h3 className="font-bold text-slate-200 uppercase tracking-widest text-sm font-mono">
            {initialData ? "Edit" : "New"} {type === "projects" ? "Project" : "Server"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex flex-col h-[70vh] max-h-[600px] overflow-hidden">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Display Name</label>
            <input 
              required
              autoFocus
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
              placeholder={type === "projects" ? "My Awesome App" : "Production VPS"}
            />
          </div>

          {type === "projects" ? (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Target Environment</label>
                <select
                  value={serverId} onChange={e => setServerId(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                >
                   <option value="local">{isMobileDevice() ? "My PC (Host Server)" : "Host PC (Local)"}</option>
                   {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-hidden" style={{marginTop: '0px'}}>
                <label className="block text-xs font-mono text-slate-400 mb-1">Pick Project Directory</label>
                <div className="flex gap-2 items-center mb-2">
                   <input 
                     required
                     value={path} onChange={e => setPath(e.target.value)}
                     className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-primary-500 transition-colors"
                     placeholder="/home/user/projects/app"
                   />
                </div>
                {serverId && <PathPicker serverId={serverId} currentPath={path} onSelectPath={setPath} />}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Hostname / IP</label>
                <input 
                  required
                  value={host} onChange={e => setHost(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Username</label>
                  <input 
                    required
                    value={user} onChange={e => setUser(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="root"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Password</label>
                  <input 
                    type="password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder={initialData?.password ? "•••••••• (Saved)" : "••••••••"}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Port</label>
                <input 
                  required
                  type="number"
                  value={port} onChange={e => setPort(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </>
          )}

          <div className="pt-2 drop-shadow-xl h-fit w-full flex-shrink-0">
            <button 
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold font-mono tracking-widest rounded-lg transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              {initialData ? "SAVE CHANGES" : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Overview;
