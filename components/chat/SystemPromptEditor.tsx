"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";

interface SystemPromptEditorProps {
  conversationId: string;
}

export function SystemPromptEditor({ conversationId }: SystemPromptEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const systemPrompt = useChatStore(
    (s) => s.conversations.find((c) => c.id === conversationId)?.systemPrompt ?? ""
  );
  const updateSystemPrompt = useChatStore((s) => s.updateSystemPrompt);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <Terminal className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">System prompt</span>
        {systemPrompt && !expanded && (
          <span className="ml-2 truncate opacity-60">{systemPrompt}</span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <Textarea
            value={systemPrompt}
            onChange={(e) => updateSystemPrompt(conversationId, e.target.value)}
            placeholder="You are a helpful assistant…"
            className="min-h-[80px] resize-none text-sm font-mono"
          />
        </div>
      )}
    </div>
  );
}
