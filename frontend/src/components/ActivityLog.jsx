import { Activity, Clock, TerminalSquare, AlertCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function ActivityLog() {
  const { terminals } = useAppContext();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-alert lg:p-8 pt-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <Activity className="text-primary-500" /> System Activity
          </h2>
          <span className="font-mono text-xs text-slate-500">Live Audit Trail</span>
        </div>

        <div className="space-y-4">
          {terminals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm border border-white/5 rounded-2xl border-dashed">
              No recent activity recorded.
            </div>
          ) : (
            <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
              {terminals.map((t) => (
                <div key={t.id} className="relative pl-6 group">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] border-2 border-slate-900 group-hover:scale-125 transition-transform" />
                  
                  <div className="glass-panel-premium p-4 rounded-xl border-white/5 shadow-lg group-hover:border-primary-500/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <TerminalSquare size={16} className="text-primary-400" />
                        <span className="font-mono text-sm text-slate-200 font-bold">{t.name}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-white/5">
                          {t.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-500">
                        <Clock size={12} />
                        {new Date(t.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-slate-400">
                      Session established and PTY attached. User interaction logged.
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Dummy history item for visual effect */}
              <div className="relative pl-6 opacity-60">
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                <div className="glass-panel-premium p-4 rounded-xl border-white/5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="font-mono text-sm text-slate-300 font-bold">System Boot</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-slate-500">
                      <Clock size={12} />
                      Earlier
                    </div>
                  </div>
                  <p className="font-mono text-xs text-slate-500">
                    Terminal manager initialized and persistent storage loaded.
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ActivityLog;
