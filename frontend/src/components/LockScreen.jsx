import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { Terminal } from "lucide-react";

function LockScreen({ onUnlock }) {
  const [inputToken, setInputToken] = useState("");
  const [bootText, setBootText] = useState("");
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const sequence = [
      "INITIALIZING CLOUD TERMINAL...",
      "ESTABLISHING SECURE TUNNEL...",
      "MOUNTING VIRTUAL FILESYSTEM...",
      "AWAITING AUTHENTICATION...",
    ];
    let current = 0;
    let textStr = "";

    const interval = setInterval(() => {
      textStr += sequence[current] + "\n";
      setBootText(textStr);
      current++;
      if (current >= sequence.length) {
        clearInterval(interval);
        setTimeout(() => setIsBooting(false), 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputToken.trim()) {
      onUnlock(inputToken.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-96 h-96 bg-primary-500 rounded-full blur-[120px]" />
      </div>

      <Motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md glass-panel rounded-xl p-8 border-t-2 border-t-primary-500/50"
      >
        <div className="flex items-center gap-3 mb-6 animate-pulse-glow w-fit">
          <Terminal className="text-primary-400 w-8 h-8" />
          <h1 className="text-2xl font-mono font-bold text-slate-100 tracking-wider">
            CLOUD<span className="text-primary-500">TERM</span>
          </h1>
        </div>

        <div className="font-mono text-sm text-primary-400/80 mb-8 whitespace-pre-wrap min-h-[5rem]">
          {bootText}
          {!isBooting && <span className="animate-pulse">_</span>}
        </div>

        {!isBooting && (
          <Motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="relative group">
              <input
                type="password"
                placeholder="Enter Access Token"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full bg-dark-900/50 border border-dark-600 rounded-lg px-4 py-3 text-slate-200 placeholder-dark-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-mono"
                required
                autoFocus
              />
              <div className="absolute inset-0 -z-10 rounded-lg bg-primary-500/0 group-hover:bg-primary-500/5 transition-colors" />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-400 text-dark-900 font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center gap-2"
            >
              INITIALIZE CONNECTION
            </button>
          </Motion.form>
        )}
      </Motion.div>
    </div>
  );
}

export default LockScreen;
