import { Users as UsersIcon, Shield, Key } from "lucide-react";

function Users() {
  return (
    <div className="flex-1 p-8 pt-6 pb-24 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
             <UsersIcon size={32} />
           </div>
        </div>
        <h2 className="text-2xl font-bold font-mono text-slate-100">User Management</h2>
        <p className="text-sm font-mono text-slate-500 leading-relaxed pb-6">
          Multi-user collaboration and role-based access control (RBAC) are coming in a future update. You'll be able to invite team members and restrict terminal access.
        </p>
        <div className="flex gap-4 justify-center">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-white/5">
             <Shield size={14} /> Admins Only
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-white/5">
             <Key size={14} /> Shared SSH Keys
          </div>
        </div>
      </div>
    </div>
  );
}

export default Users;
