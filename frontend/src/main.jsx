import { createRoot } from "react-dom/client";
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import "./index.css";
import App from "./App.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById("root")).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: '#38bdf8', // primary-400
        colorBackground: '#0f172a', // slate-900
        colorText: '#f8fafc',
        colorInputBackground: '#1e293b', // slate-800
      }
    }}
  >
    <App />
  </ClerkProvider>
);
