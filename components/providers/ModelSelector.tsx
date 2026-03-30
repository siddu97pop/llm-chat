"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStore } from "@/lib/store/chat-store";
import { useModels } from "@/hooks/useModels";

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const selectedProvider = useChatStore((s) => s.settings.selectedProvider);
  const selectedModelId = useChatStore((s) => s.settings.selectedModelId);
  const showFreeOnly = useChatStore((s) => s.settings.showFreeModelsOnly);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const setShowFreeModelsOnly = useChatStore((s) => s.setShowFreeModelsOnly);

  const { models, modelsLoading, modelsError, fetchModels, visibleModels } = useModels();

  // Auto-fetch when the component mounts or provider changes
  useEffect(() => {
    fetchModels(selectedProvider);
  }, [selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = visibleModels(selectedProvider);
  const loading = modelsLoading[selectedProvider];
  const error = modelsError[selectedProvider];

  const selectedModel = models[selectedProvider].find((m) => m.id === selectedModelId);
  const displayName = selectedModel?.name ?? "Select model…";

  const handleSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-8 max-w-[220px] justify-between gap-1 text-xs"
        )}
      >
        <span className="truncate">{displayName}</span>
        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
      </DialogTrigger>
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-sm font-medium">
            {selectedProvider === "openrouter" ? "OpenRouter Models" : "Local Ollama Models"}
          </DialogTitle>
          {selectedProvider === "openrouter" && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowFreeModelsOnly(!showFreeOnly)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border transition-colors",
                  showFreeOnly
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground"
                )}
              >
                Free only
              </button>
              <span className="text-xs text-muted-foreground">
                {list.length} models
              </span>
              <button
                onClick={() => fetchModels(selectedProvider, true)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </DialogHeader>

        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
            {selectedProvider === "ollama" && (
              <span className="ml-1 text-muted-foreground">
                — is Ollama running?
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-2 px-4 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <Command className="border-none shadow-none">
            <CommandInput placeholder="Search models…" className="h-9 text-sm" />
            <CommandList className="max-h-72">
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandGroup>
                {list.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={handleSelect}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        selectedModelId === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 truncate text-sm">{model.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {model.isFree && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          Free
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatContextLength(model.contextLength)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatContextLength(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ctx`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K ctx`;
  return `${n} ctx`;
}
