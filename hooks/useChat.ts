"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/lib/store/chat-store";
import { useStreamMetrics } from "@/hooks/useStreamMetrics";
import {
  readSSEStream,
  parseOpenAIChunk,
  parseOllamaChunk,
  getOpenAIDelta,
  estimateTokens,
} from "@/lib/stream";
import type { ChatRequestBody } from "@/lib/types";

/**
 * Core chat hook — orchestrates sending messages, streaming responses,
 * and updating the store as chunks arrive.
 */
export function useChat(conversationId: string) {
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId) ?? null
  );
  const settings = useChatStore((s) => s.settings);
  const models = useChatStore((s) => s.models);
  const metrics = useChatStore((s) => s.metrics);

  const addMessage = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const finalizeMessage = useChatStore((s) => s.finalizeMessage);
  const updateConversationTitle = useChatStore((s) => s.updateConversationTitle);

  const { onStreamStart, onChunk, onStreamEnd } = useStreamMetrics();

  // Abort controller ref — allows cancelling an in-progress stream
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!conversation) return;
      if (metrics.isStreaming) return; // prevent concurrent sends

      const { selectedProvider, selectedModelId, ollamaUrl } = settings;

      if (!selectedModelId) return;

      // 1. Add the user message to the store
      addMessage(conversationId, { role: "user", content: userContent });

      // Auto-title the conversation from the first user message
      if (conversation.messages.length === 0) {
        const title = userContent.slice(0, 50).trim() + (userContent.length > 50 ? "…" : "");
        updateConversationTitle(conversationId, title);
      }

      // 2. Add a placeholder assistant message (empty, to be streamed into)
      const assistantMsgId = addMessage(conversationId, {
        role: "assistant",
        content: "",
      });

      // 3. Build message history to send (system prompt + all messages)
      const history = [
        ...(conversation.systemPrompt
          ? [{ role: "system" as const, content: conversation.systemPrompt }]
          : []),
        ...conversation.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userContent },
      ];

      // Estimate input tokens for context tracking
      const inputTokenEstimate = history.reduce(
        (acc, m) => acc + estimateTokens(m.content),
        0
      );

      // Find the context window for the selected model
      const modelList = models[selectedProvider];
      const modelInfo = modelList.find((m) => m.id === selectedModelId);
      const contextMax = modelInfo?.contextLength ?? 8192;

      // 4. Start metrics tracking
      onStreamStart(contextMax);

      // 5. Fire the request
      abortRef.current = new AbortController();

      const requestBody: ChatRequestBody = {
        messages: history,
        model: selectedModelId,
        provider: selectedProvider,
        ollamaUrl,
      };

      let response: Response;
      try {
        response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          finalizeMessage(conversationId, assistantMsgId, { error: "Cancelled" });
          onStreamEnd();
          return;
        }
        finalizeMessage(conversationId, assistantMsgId, {
          error: (err as Error).message ?? "Network error",
        });
        onStreamEnd();
        return;
      }

      // Handle non-streaming error response
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errJson = await response.json();
          errorMessage = errJson.error ?? errorMessage;
        } catch {
          // keep default
        }
        finalizeMessage(conversationId, assistantMsgId, { error: errorMessage });
        onStreamEnd();
        return;
      }

      // 6. Read the stream chunk by chunk
      let exactInputTokens: number | undefined;
      let exactOutputTokens: number | undefined;
      let lastTps: number | undefined;

      try {
        for await (const data of readSSEStream(response)) {
          // Check for abort between chunks
          if (abortRef.current?.signal.aborted) break;

          if (selectedProvider === "openrouter") {
            const chunk = parseOpenAIChunk(data);
            if (!chunk) continue; // [DONE] or unparseable

            const delta = getOpenAIDelta(chunk);
            if (delta) {
              appendToMessage(conversationId, assistantMsgId, delta);
              onChunk(delta, inputTokenEstimate);
            }

            // Final chunk from OpenRouter includes exact usage
            if (chunk.usage) {
              exactInputTokens = chunk.usage.prompt_tokens;
              exactOutputTokens = chunk.usage.completion_tokens;
            }
          } else {
            // Ollama
            const chunk = parseOllamaChunk(data);
            if (!chunk) continue;

            const delta = chunk.message?.content ?? "";
            if (delta) {
              appendToMessage(conversationId, assistantMsgId, delta);
              onChunk(delta, inputTokenEstimate);
            }

            // Final Ollama chunk has exact counts
            if (chunk.done) {
              if (chunk.eval_count != null) exactOutputTokens = chunk.eval_count;
              if (chunk.prompt_eval_count != null) exactInputTokens = chunk.prompt_eval_count;
              if (chunk.eval_count != null && chunk.eval_duration != null) {
                // eval_duration is in nanoseconds
                lastTps = Math.round(chunk.eval_count / (chunk.eval_duration / 1e9));
              }
              break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          finalizeMessage(conversationId, assistantMsgId, {
            error: (err as Error).message ?? "Stream read error",
          });
          onStreamEnd();
          return;
        }
      }

      // 7. Finalize
      onStreamEnd(exactInputTokens, exactOutputTokens);

      finalizeMessage(conversationId, assistantMsgId, {
        inputTokens: exactInputTokens ?? inputTokenEstimate,
        outputTokens: exactOutputTokens,
        tokensPerSecond: lastTps,
      });
    },
    [
      conversation,
      conversationId,
      settings,
      models,
      metrics.isStreaming,
      addMessage,
      appendToMessage,
      finalizeMessage,
      updateConversationTitle,
      onStreamStart,
      onChunk,
      onStreamEnd,
    ]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    conversation,
    metrics,
    sendMessage,
    cancelStream,
  };
}
