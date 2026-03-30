"use client";

import { useCallback } from "react";
import { useChatStore } from "@/lib/store/chat-store";
import type { Provider } from "@/lib/types";

/**
 * Fetches and caches model lists per provider.
 * Models are session-scoped (not persisted) — re-fetched on first use per session.
 */
export function useModels() {
  const models = useChatStore((s) => s.models);
  const modelsLoading = useChatStore((s) => s.modelsLoading);
  const modelsError = useChatStore((s) => s.modelsError);
  const setModels = useChatStore((s) => s.setModels);
  const setModelsLoading = useChatStore((s) => s.setModelsLoading);
  const setModelsError = useChatStore((s) => s.setModelsError);
  const settings = useChatStore((s) => s.settings);

  const fetchModels = useCallback(
    async (provider: Provider, force = false) => {
      // Skip if already loaded (unless forced)
      if (!force && models[provider].length > 0) return;
      // Skip if already loading
      if (modelsLoading[provider]) return;

      setModelsLoading(provider, true);
      setModelsError(provider, null);

      try {
        const params = new URLSearchParams({ provider });
        if (provider === "ollama") {
          params.set("ollamaUrl", settings.ollamaUrl);
        }
        const res = await fetch(`/api/models?${params}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? `Failed to fetch ${provider} models`);
        }

        setModels(provider, json.models);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch models";
        setModelsError(provider, message);
      } finally {
        setModelsLoading(provider, false);
      }
    },
    [models, modelsLoading, settings.ollamaUrl, setModels, setModelsLoading, setModelsError]
  );

  // Filtered view for OpenRouter: free-only toggle
  const visibleModels = useCallback(
    (provider: Provider) => {
      const list = models[provider];
      if (provider === "openrouter" && settings.showFreeModelsOnly) {
        return list.filter((m) => m.isFree);
      }
      return list;
    },
    [models, settings.showFreeModelsOnly]
  );

  return {
    models,
    modelsLoading,
    modelsError,
    fetchModels,
    visibleModels,
  };
}
