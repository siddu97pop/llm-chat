"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContextUsageBar } from "./ContextUsageBar";
import { useChatStore } from "@/lib/store/chat-store";

export function StatusBar() {
  const metrics = useChatStore((s) => s.metrics);
  const settings = useChatStore((s) => s.settings);
  const models = useChatStore((s) => s.models);

  const selectedModel = models[settings.selectedProvider].find(
    (m) => m.id === settings.selectedModelId
  );
  const modelName = selectedModel?.name ?? settings.selectedModelId ?? "No model selected";
  const providerLabel =
    settings.selectedProvider === "openrouter" ? "OpenRouter" : "Ollama";

  const showTps = metrics.tokensPerSecond > 0;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-4 py-1.5 text-[11px] text-muted-foreground">
      {/* Left — provider / model */}
      <span className="truncate min-w-0">
        <span className="font-medium text-foreground/70">{providerLabel}</span>
        <span className="mx-1 opacity-40">/</span>
        <span className="truncate">{modelName}</span>
      </span>

      {/* Right — tok/s + context bar */}
      <div className="flex items-center gap-3 shrink-0">
        {showTps && (
          <span
            className={cn(
              "flex items-center gap-1 tabular-nums",
              metrics.isStreaming && "text-primary"
            )}
          >
            <Zap className="h-3 w-3" />
            {metrics.tokensPerSecond}&thinsp;tok/s
          </span>
        )}
        {metrics.contextMax > 0 && (
          <ContextUsageBar used={metrics.contextUsed} max={metrics.contextMax} />
        )}
      </div>
    </div>
  );
}
