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
  const setOllamaApiKey = useChatStore((s) => s.setOllamaApiKey);

  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [ollamaInput, setOllamaInput] = useState(settings.ollamaUrl);
  const [ollamaKeyInput, setOllamaKeyInput] = useState(settings.ollamaApiKey);
  const [showOllamaKey, setShowOllamaKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasOrKey = !!settings.openrouterApiKey;
  const hasOllamaKey = !!settings.ollamaApiKey;

  // Check server-side cookie on open
  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.hasKey && !settings.openrouterApiKey) {
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
    if (ollamaKeyInput !== settings.ollamaApiKey) {
      setOllamaApiKey(ollamaKeyInput);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearOrKey = async () => {
    await clearApiKey();
    setKeyInput("");
  };

  const handleClearOllamaKey = () => {
    setOllamaApiKey("");
    setOllamaKeyInput("");
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
              {hasOrKey && (
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
              {hasOrKey && (
                <Button variant="outline" size="sm" onClick={handleClearOrKey}>
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
              Default: <code>http://localhost:11434</code>. Use a cloud Ollama URL if not running locally.
            </p>
          </div>

          {/* Ollama API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ollama API Key
              {hasOllamaKey && (
                <span className="ml-2 text-xs text-green-500 font-normal">● set</span>
              )}
              <span className="ml-2 text-xs text-muted-foreground font-normal">optional</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showOllamaKey ? "text" : "password"}
                  placeholder="Required for cloud Ollama endpoints"
                  value={ollamaKeyInput}
                  onChange={(e) => setOllamaKeyInput(e.target.value)}
                  className="pr-9 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowOllamaKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showOllamaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {hasOllamaKey && (
                <Button variant="outline" size="sm" onClick={handleClearOllamaKey}>
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Sent as <code>Authorization: Bearer &lt;key&gt;</code> to your Ollama endpoint.
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
