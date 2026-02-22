import { Lock, Eye } from "lucide-react";

function TerminalLock({ serverName = "Fozzy Server", onUnlock }) {
  return (
    <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-premium w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl border-white/5 mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold text-slate-100 tracking-wide">
              Server Locked
            </h2>
            <p className="text-sm font-mono text-slate-500">{serverName}</p>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <p className="text-sm font-mono text-slate-400 leading-relaxed">
            This server is password-protected. Enter the lock password to access your terminal.
          </p>

          <div className="relative">
            <input
              type="password"
              placeholder="Enter lock password"
              className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-3 sm:py-4 text-slate-200 font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all pr-12"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1">
              <Eye size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={onUnlock}
          className="w-full bg-primary-600/90 hover:bg-primary-500 text-slate-100 font-mono text-sm font-semibold tracking-wide py-3 sm:py-4 rounded-lg flex items-center justify-center gap-2 border border-primary-400/30 transition-all shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:shadow-[0_0_30px_rgba(56,189,248,0.3)] active:scale-[0.98]"
        >
          <Lock size={16} />
          Unlock Terminal
        </button>
      </div>
    </div>
  );
}

export default TerminalLock;
