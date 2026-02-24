import { SignIn } from "@clerk/clerk-react";
import { Terminal } from "lucide-react";

function LockScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark-900 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-96 h-96 bg-primary-500 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-6 animate-pulse-glow">
          <Terminal className="text-primary-400 w-8 h-8" />
          <h1 className="text-2xl font-mono font-bold text-slate-100 tracking-wider">
            CLOUD<span className="text-primary-500">TERM</span>
          </h1>
        </div>

        <SignIn 
          appearance={{
            elements: {
              card: "bg-dark-900/50 backdrop-blur-xl border border-primary-500/20 shadow-2xl rounded-xl",
              headerTitle: "text-slate-100 font-mono",
              headerSubtitle: "text-primary-400/80 font-mono",
              socialButtonsBlockButton: "border-primary-500/30 hover:bg-primary-500/10 text-slate-200",
              dividerLine: "bg-primary-500/20",
              dividerText: "text-primary-400/60 font-mono",
              formFieldLabel: "text-slate-300 font-mono",
              formFieldInput: "bg-dark-900 border-dark-600 text-slate-200 focus:border-primary-500 focus:ring-primary-500",
              formButtonPrimary: "bg-primary-500 hover:bg-primary-400 text-dark-900 font-bold",
              footerActionText: "text-slate-400 font-mono",
              footerActionLink: "text-primary-400 hover:text-primary-300",
            }
          }}
        />
      </div>
    </div>
  );
}

export default LockScreen;
