import { UserProfile } from "@clerk/clerk-react";
import { Users as UsersIcon, TerminalSquare, Server, Folder, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function ActiveTerminalsPage() {
  const { terminals, killTerminal } = useAppContext();
  
  if (!terminals || terminals.length === 0) {
    return <div className="text-slate-400 font-mono mt-4">No active terminals across devices.</div>;
  }
  
  return (
    <div className="mt-4 space-y-3">
      {terminals.map(t => (
        <div key={t.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-sm font-mono text-slate-200">{t.name || 'Terminal'}</span>
            <span className="text-xs font-mono text-slate-500">ID: {t.id.substring(0,8)}</span>
          </div>
          <button 
            onClick={() => killTerminal(t.id)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function MyProjectsPage() {
  const { projects } = useAppContext();
  
  if (!projects || projects.length === 0) {
    return <div className="text-slate-400 font-mono mt-4">No projects created yet.</div>;
  }
  
  return (
    <div className="mt-4 space-y-3">
      {projects.map(p => (
        <div key={p.id} className="flex flex-col p-3 bg-slate-800/50 rounded-xl border border-white/5">
          <span className="text-sm font-mono text-slate-200 font-bold">{p.name}</span>
          <span className="text-xs font-mono text-slate-500">{p.path}</span>
        </div>
      ))}
    </div>
  );
}

function SavedServersPage() {
  const { servers } = useAppContext();
  
  if (!servers || servers.length === 0) {
    return <div className="text-slate-400 font-mono mt-4">No saved servers yet.</div>;
  }
  
  return (
    <div className="mt-4 space-y-3">
      {servers.map(s => (
        <div key={s.id} className="flex flex-col p-3 bg-slate-800/50 rounded-xl border border-white/5">
          <span className="text-sm font-mono text-slate-200 font-bold">{s.name}</span>
          <span className="text-xs font-mono text-slate-500">{s.user}@{s.host}:{s.port}</span>
        </div>
      ))}
    </div>
  );
}

function Users() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pt-6 pb-24 flex flex-col items-center">
      <div className="w-full max-w-4xl border-b border-slate-700/50 pb-4 mb-8">
        <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
          <UsersIcon className="text-primary-500" /> Account Management
        </h2>
      </div>

      <div className="w-full flex justify-center clerk-dark-override clerk-no-scroll">
        <UserProfile 
          appearance={{
            elements: {
              cardBox: "bg-dark-900/80 backdrop-blur-xl border border-primary-500/20 shadow-2xl rounded-xl",
              navbar: "border-r border-slate-700/50",
              navbarButton: "text-slate-300 hover:text-white hover:bg-slate-800/50",
              navbarButton__active: "text-primary-400 bg-primary-500/10",
              headerTitle: "text-slate-100 font-mono",
              headerSubtitle: "text-primary-400/80 font-mono",
              profileSectionTitleText: "text-slate-200 font-mono border-b border-primary-500/20",
              profileSectionContent: "text-slate-300 font-mono",
              dividerLine: "bg-slate-700/50",
              dividerText: "text-slate-500 font-mono",
              formFieldLabel: "text-slate-300 font-mono",
              formFieldInput: "bg-dark-900 border-slate-700 text-slate-200 focus:border-primary-500 focus:ring-primary-500",
              formButtonPrimary: "bg-primary-500 hover:bg-primary-400 text-dark-900 font-bold",
              badge: "bg-primary-500/20 text-primary-300 border border-primary-500/30",
              userButtonPopoverCard: "bg-dark-900 border border-primary-500/30",
              userButtonPopoverActionButtonText: "text-slate-200",
              scrollBox: "custom-scrollbar",
            }
          }}
        >
          <UserProfile.Page
            label="Active Terminals"
            labelIcon={<TerminalSquare size={16} />}
            url="active-terminals"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono mb-2">Active Terminals</h1>
              <p className="text-sm text-slate-400 font-mono mb-6">Manage terminal sessions running across all your devices. Click delete to instantly drop a connection from anywhere.</p>
              <ActiveTerminalsPage />
            </div>
          </UserProfile.Page>
          
          <UserProfile.Page
            label="My Projects"
            labelIcon={<Folder size={16} />}
            url="my-projects"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono mb-2">My Projects</h1>
              <p className="text-sm text-slate-400 font-mono mb-6">Repositories and local folders synced to your account.</p>
              <MyProjectsPage />
            </div>
          </UserProfile.Page>

          <UserProfile.Page
            label="Saved Servers"
            labelIcon={<Server size={16} />}
            url="saved-servers"
          >
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono mb-2">Saved Servers</h1>
              <p className="text-sm text-slate-400 font-mono mb-6">SSH credentials available across your devices.</p>
              <SavedServersPage />
            </div>
          </UserProfile.Page>
        </UserProfile>
      </div>
    </div>
  );
}

export default Users;
