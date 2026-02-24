import React from "react";
import { X, Terminal as TerminalIcon } from "lucide-react";
import { useTerminalSettings } from "../hooks/useTerminalSettings";

export default function SettingsModal({ onClose }) {
  const [settings, setSettings] = useTerminalSettings();

  const handleSave = (e) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel-premium rounded-2xl border-white/10 w-full max-w-sm overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className="text-primary-400" />
            <h3 className="font-bold text-slate-200 uppercase tracking-widest text-sm font-mono">
              Terminal Settings
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">Font Size (px)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="10" 
                  max="24" 
                  value={settings.fontSize}
                  onChange={e => setSettings({ fontSize: parseInt(e.target.value) })}
                  className="flex-1 accent-primary-500 bg-slate-800 rounded-lg appearance-none h-2"
                />
                <span className="font-mono text-sm text-slate-200 w-6 text-right">{settings.fontSize}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">Cursor Style</label>
              <div className="grid grid-cols-3 gap-2">
                {["block", "underline", "bar"].map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSettings({ cursorStyle: style })}
                    className={`py-2 px-3 rounded-lg font-mono text-xs capitalize border transition-all ${
                      settings.cursorStyle === style 
                      ? "bg-primary-500/20 border-primary-500/50 text-primary-300"
                      : "bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-mono text-slate-400">Cursor Blink</label>
              <button
                type="button"
                onClick={() => setSettings({ cursorBlink: !settings.cursorBlink })}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.cursorBlink ? 'bg-primary-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.cursorBlink ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-6">
            <button 
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold font-mono tracking-widest rounded-lg transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              DONE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
