import { useState } from "react";
import { Users as UsersIcon, Shield, Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function Users() {
  const { users, addUser, removeUser } = useAppContext();
  const [newToken, setNewToken] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    try {
      await addUser({ token: newToken.trim(), role: 'admin' });
      setNewToken("");
    } catch (err) {
      alert("Failed to add token: " + err.message);
    }
  };

  const copyToClipboard = (token, id) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pt-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <UsersIcon className="text-amber-500" /> Access Management
          </h2>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
             <Shield size={14} /> Admins Only
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Token Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel-premium p-6 rounded-2xl border-white/5 shadow-xl">
              <h3 className="font-mono font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Key size={16} className="text-primary-400" /> Generate Token
              </h3>
              <p className="font-mono text-xs text-slate-500 mb-4">
                Create a new access token to share Cloud Terminal access with another device.
              </p>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Passphrase / Token String</label>
                  <input 
                    required
                    value={newToken} 
                    onChange={e => setNewToken(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="e.g. secure-guest-pass"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold font-mono text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                >
                  <Plus size={16} /> GENERATE
                </button>
              </form>
            </div>
            
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30">
              <p className="font-mono text-xs text-slate-500 leading-relaxed">
                Tokens grant full access to your terminal environments. Only share them with trusted individuals or your own alternate devices.
              </p>
            </div>
          </div>

          {/* Token List */}
          <div className="lg:col-span-2">
            <div className="glass-panel-premium rounded-2xl border-white/5 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-900/50 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-mono font-bold text-slate-200">Active Tokens</h3>
                <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">{users.length} Active</span>
              </div>
              
              <div className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-mono text-sm">
                    No custom tokens generated yet.
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500">
                          <Key size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-slate-200 truncate">{user.token}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
                              {user.role}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:self-center">
                        <button 
                          onClick={() => copyToClipboard(user.token, user.id)}
                          className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 font-mono text-xs transition-colors border border-white/5"
                        >
                          {copiedId === user.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          {copiedId === user.id ? "COPIED" : "COPY"}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Revoke this token immediately? Connections using it will drop on next refresh.")) {
                              removeUser(user.id);
                            }
                          }}
                          className="p-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 transition-colors rounded-lg border border-red-500/20"
                          title="Revoke Token"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Users;
