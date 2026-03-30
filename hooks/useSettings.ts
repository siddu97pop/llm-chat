"use client";

import { useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store/chat-store";
import type { Theme } from "@/lib/types";

/**
 * Manages app settings: theme toggling, API key save/clear, Ollama URL.
 */
export function useSettings() {
  const settings = useChatStore((s) => s.settings);
  const setTheme = useChatStore((s) => s.setTheme);
  const setApiKey = useChatStore((s) => s.setApiKey);
  const setOllamaUrl = useChatStore((s) => s.setOllamaUrl);

  // Apply theme class to <html> whenever settings.theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("llm-chat-theme", "dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
      localStorage.setItem("llm-chat-theme", "light");
    } else {
      // system
      localStorage.removeItem("llm-chat-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [settings.theme]);

  const saveApiKey = useCallback(async (key: string) => {
    // Persist to httpOnly cookie via the settings API route
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    // Also keep in Zustand so the UI can show "key is set"
    setApiKey(key);
  }, [setApiKey]);

  const clearApiKey = useCallback(async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "" }),
    });
    setApiKey("");
  }, [setApiKey]);

  const cycleTheme = useCallback(() => {
    const next: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
    setTheme(next[settings.theme]);
  }, [settings.theme, setTheme]);

  return {
    settings,
    saveApiKey,
    clearApiKey,
    setOllamaUrl,
    cycleTheme,
    setTheme,
  };
}
