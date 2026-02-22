import { motion as Motion } from "framer-motion";
import { LayoutGrid, TerminalSquare, PlusCircle, LayoutTemplate, Folder } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "servers", label: "Servers", icon: TerminalSquare },
  { id: "add", label: "", icon: PlusCircle, primary: true },
  { id: "workspace", label: "Workspace", icon: LayoutTemplate },
  { id: "projects", label: "Projects", icon: Folder },
];

function BottomNav({ currentView, onViewChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-panel-premium border-t border-white/10 rounded-t-2xl pb-safe">
      <div className="flex items-center justify-between px-2 h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => onViewChange('overview')}
                className="relative -top-4 bg-primary-500 text-slate-900 p-3 rounded-full shadow-[0_4px_20px_rgba(56,189,248,0.5)] transition-transform active:scale-95"
              >
                <Icon size={24} className="stroke-[2.5]" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={clsx(
                    "transition-colors duration-300",
                    isActive ? "text-primary-400" : "text-slate-500"
                  )}
                />
                {isActive && (
                  <Motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full shadow-[0_-2px_8px_rgba(56,189,248,0.8)]"
                  />
                )}
              </div>
              <span
                className={clsx(
                  "text-[10px] font-medium tracking-wide transition-colors",
                  isActive ? "text-primary-300" : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNav;
