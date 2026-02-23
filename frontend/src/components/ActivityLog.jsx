import { Activity, Clock, TerminalSquare, AlertCircle, Key } from "lucide-react";
import { useAppContext } from "../context/AppContext";

function ActivityLog() {
  const { activityLogs } = useAppContext();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 pt-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <Activity className="text-primary-500" /> System Activity
          </h2>
          <span className="font-mono text-xs text-slate-500">Live Audit Trail</span>
        </div>

        <div className="space-y-4">
          {!activityLogs || activityLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-sm border border-white/5 rounded-2xl border-dashed">
              No recent activity recorded.
            </div>
          ) : (
            <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="relative pl-6 group">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(56,189,248,0.5)] border-2 border-slate-900 group-hover:scale-125 transition-transform" />
                  
                  <div className="glass-panel-premium p-4 rounded-xl border-white/5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 transition-colors hover:border-primary-500/20">
                    <div className="flex items-center gap-3">
                      {log.type === "auth" ? (
                        <Key size={18} className="text-amber-400" />
                      ) : (
                        <TerminalSquare size={18} className="text-primary-400" />
                      )}
                      <div>
                        <span className="font-mono text-sm text-slate-200 font-bold block">
                          {log.type === "auth" ? "Authentication Event" : "Terminal Event"}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {log.message}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs text-slate-500 whitespace-nowrap">
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="relative pl-6 opacity-60">
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-slate-900" />
                <div className="glass-panel-premium p-4 rounded-xl border-white/5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="font-mono text-sm text-slate-300 font-bold">Log History End</span>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-slate-500">
                    Showing max 100 recent system events.
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
