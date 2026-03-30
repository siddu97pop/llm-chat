"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Settings } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useChatStore } from "@/lib/store/chat-store";

export function SettingsModal() {
  const { settings, saveApiKey, clearApiKey, setOllamaUrl } = useSettings();
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [ollamaInput, setOllamaInput] = useState(settings.ollamaUrl);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const hasKey = !!settings.openrouterApiKey;

  // Check server-side cookie on open (key may have been set in a prior session)
  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.hasKey && !settings.openrouterApiKey) {
            // Cookie exists but Zustand doesn't know — show placeholder
            setKeyInput("••••••••••••••••");
          }
        })
        .catch(() => {});
    }
  }, [open, settings.openrouterApiKey]);

  const handleSave = async () => {
    setSaving(true);
    if (keyInput && keyInput !== "••••••••••••••••") {
      await saveApiKey(keyInput);
    }
    if (ollamaInput !== settings.ollamaUrl) {
      setOllamaUrl(ollamaInput);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearKey = async () => {
    await clearApiKey();
    setKeyInput("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
        <Settings className="h-4 w-4" />
        <span className="sr-only">Settings</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* OpenRouter API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              OpenRouter API Key
              {hasKey && (
                <span className="ml-2 text-xs text-green-500 font-normal">● set</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="pr-9 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {hasKey && (
                <Button variant="outline" size="sm" onClick={handleClearKey}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Get your free key at{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          {/* Ollama URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ollama URL</label>
            <Input
              type="url"
              value={ollamaInput}
              onChange={(e) => setOllamaInput(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Default: <code>http://localhost:11434</code>. Make sure Ollama is running
              with <code>OLLAMA_ORIGINS=*</code> if using a custom URL.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving…" : saved ? "Saved!" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
