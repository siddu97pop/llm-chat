"use client";

import { useEffect } from "react";
import { KeyRound } from "lucide-react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { SystemPromptEditor } from "./SystemPromptEditor";
import { StatusBar } from "@/components/status/StatusBar";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/lib/store/chat-store";

export function ChatInterface() {
  const activeId = useChatStore((s) => s.activeConversationId);
  const createConversation = useChatStore((s) => s.createConversation);
  const clearConversation = useChatStore((s) => s.clearConversation);

  // Create a conversation on first load if none exists
  useEffect(() => {
    if (!activeId) {
      createConversation();
    }
  }, [activeId, createConversation]);

  if (!activeId) return null;

  return <ActiveChat conversationId={activeId} onClear={() => clearConversation(activeId)} />;
}

function ActiveChat({
  conversationId,
  onClear,
}: {
  conversationId: string;
  onClear: () => void;
}) {
  const { conversation, metrics, sendMessage, cancelStream } = useChat(conversationId);
  const noModelSelected = useChatStore((s) => !s.settings.selectedModelId);
  const selectedProvider = useChatStore((s) => s.settings.selectedProvider);
  const openrouterApiKey = useChatStore((s) => s.settings.openrouterApiKey);
  const noApiKey = selectedProvider === "openrouter" && !openrouterApiKey;

  if (!conversation) return null;

  return (
    <div className="flex h-full flex-col">
      <SystemPromptEditor conversationId={conversationId} />

      <MessageList conversation={conversation} />

      {/* Warning banners */}
      {(noModelSelected || noApiKey) && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 space-y-1.5">
          {noModelSelected && (
            <p className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
              Select a model in the top bar to start chatting.
            </p>
          )}
          {noApiKey && (
            <p className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              OpenRouter API key not set — open <strong>Settings</strong> (gear icon) to add it.
            </p>
          )}
        </div>
      )}

      <StatusBar />

      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        onClear={onClear}
        isStreaming={metrics.isStreaming}
        disabled={noModelSelected}
      />
    </div>
  );
}
