"use client";

import { MessageSquare } from "lucide-react";
import { ProviderSwitcher } from "@/components/providers/ProviderSwitcher";
import { ModelSelector } from "@/components/providers/ModelSelector";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { SettingsModal } from "@/components/settings/SettingsModal";

export function TopBar() {
  return (
    <header className="border-b border-border bg-background">
      {/* Main row */}
      <div className="flex h-12 items-center justify-between gap-3 px-4">
        {/* Left — app identity */}
        <div className="flex items-center gap-2 shrink-0">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">LLM Chat</span>
        </div>

        {/* Center — provider + model (hidden on very small screens, shown on sm+) */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <ProviderSwitcher />
          <ModelSelector />
        </div>

        {/* Right — theme + settings */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <SettingsModal />
        </div>
      </div>

      {/* Mobile second row — provider + model */}
      <div className="flex sm:hidden items-center gap-2 px-4 pb-2">
        <ProviderSwitcher />
        <ModelSelector />
      </div>
    </header>
  );
}
