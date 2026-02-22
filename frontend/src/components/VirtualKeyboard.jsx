import { useState, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import clsx from "clsx";

const KEYS = [
  { label: "ESC", value: "\x1b", icon: "ESC", colSpan: 1 },
  { label: "TAB", value: "\t", icon: "TAB", colSpan: 1 },
  { label: "CTRL+C", value: "\x03", icon: "^C", colSpan: 1 },
  { label: "UP", value: "\x1b[A", icon: "↑", colSpan: 1 },
  { label: "DOWN", value: "\x1b[B", icon: "↓", colSpan: 1 },
  { label: "LEFT", value: "\x1b[D", icon: "←", colSpan: 1 },
  { label: "RIGHT", value: "\x1b[C", icon: "→", colSpan: 1 },
];

function VirtualKeyboard({ onSend }) {
  const [activeKey, setActiveKey] = useState(null);

  const handlePress = useCallback(
    (keyItem) => {
      setActiveKey(keyItem.label);
      onSend(keyItem.value);

      // Haptic glow effect
      setTimeout(() => {
        setActiveKey(null);
      }, 150);
    },
    [onSend],
  );

  return (
    <Motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel-premium p-2 sm:p-3 rounded-2xl mx-auto flex gap-1.5 sm:gap-2 justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-b-0 border-x-white/5"
    >
      {KEYS.map((keyItem) => (
        <button
          key={keyItem.label}
          type="button"
          onClick={() => handlePress(keyItem)}
          className={clsx(
            "relative group flex items-center justify-center font-mono font-bold text-sm sm:text-base rounded-lg transition-all duration-150 overflow-hidden",
            "bg-slate-900/60 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.4)]",
            "w-10 h-11 sm:w-12 sm:h-12",
            activeKey === keyItem.label
              ? "bg-primary-500 text-slate-900 scale-95 border-primary-400 shadow-[0_0_20px_rgba(56,189,248,0.8)]"
              : "text-slate-300 hover:text-white hover:border-white/20 hover:bg-slate-800/80 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5",
          )}
          style={{ gridColumn: `span ${keyItem.colSpan}` }}
        >
          {/* Subtle top reflection for 'keycap' effect */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-lg pointer-events-none" />

          <span className="relative z-10">{keyItem.icon}</span>
        </button>
      ))}
    </Motion.div>
  );
}

export default VirtualKeyboard;
