"use client";

import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/store/chat-store";
import { useModels } from "@/hooks/useModels";
import type { Provider } from "@/lib/types";

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "openrouter", label: "OpenRouter" },
  { id: "ollama", label: "Ollama" },
];

export function ProviderSwitcher() {
  const selectedProvider = useChatStore((s) => s.settings.selectedProvider);
  const setProvider = useChatStore((s) => s.setProvider);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const settings = useChatStore((s) => s.settings);
  const { fetchModels } = useModels();

  const handleSwitch = (provider: Provider) => {
    if (provider === selectedProvider) return;
    setProvider(provider);
    setSelectedModel(""); // reset model when switching provider
    fetchModels(provider);
  };

  return (
    <div className="flex items-center rounded-md border border-border bg-muted p-0.5 text-sm">
      {PROVIDERS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleSwitch(id)}
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            selectedProvider === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
