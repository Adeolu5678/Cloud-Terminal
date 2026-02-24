import { useState, useEffect } from "react";

const SETTINGS_KEY = "cloud-terminal:settings";
const defaultSettings = { fontSize: 14, cursorStyle: "bar", cursorBlink: true };

export function useTerminalSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        // ignore
      }
    };
    window.addEventListener("terminal-settings-changed", handleStorage);
    // Handle cross-tab sync if needed
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("terminal-settings-changed", handleStorage);
      window.removeEventListener("storage", handleStorage);
    }
  }, []);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    setSettings(merged);
    window.dispatchEvent(new Event("terminal-settings-changed"));
  };

  return [settings, updateSettings];
}
