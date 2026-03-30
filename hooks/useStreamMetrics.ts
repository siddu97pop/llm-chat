"use client";

import { useRef, useCallback } from "react";
import { useChatStore } from "@/lib/store/chat-store";
import { estimateTokens } from "@/lib/stream";

/**
 * Tracks live streaming metrics: tokens/sec, context usage.
 *
 * Usage:
 *   const { onStreamStart, onChunk, onStreamEnd } = useStreamMetrics();
 *   Call onStreamStart(contextMax) before streaming begins.
 *   Call onChunk(deltaText) for each arriving text chunk.
 *   Call onStreamEnd(exactInputTokens?, exactOutputTokens?) when done.
 */
export function useStreamMetrics() {
  const startStreaming = useChatStore((s) => s.startStreaming);
  const updateMetrics = useChatStore((s) => s.updateMetrics);
  const stopStreaming = useChatStore((s) => s.stopStreaming);

  // Track timing and counts in refs so we don't trigger re-renders on every chunk
  const startTimeRef = useRef<number>(0);
  const outputTokensRef = useRef<number>(0);

  const onStreamStart = useCallback(
    (contextMax: number) => {
      startTimeRef.current = performance.now();
      outputTokensRef.current = 0;
      startStreaming(contextMax);
    },
    [startStreaming]
  );

  const onChunk = useCallback(
    (deltaText: string, runningInputTokens: number) => {
      if (!deltaText) return;

      outputTokensRef.current += estimateTokens(deltaText);
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const tokensPerSecond =
        elapsed > 0 ? Math.round(outputTokensRef.current / elapsed) : 0;

      updateMetrics({
        tokensPerSecond,
        outputTokens: outputTokensRef.current,
        inputTokens: runningInputTokens,
        contextUsed: runningInputTokens + outputTokensRef.current,
      });
    },
    [updateMetrics]
  );

  const onStreamEnd = useCallback(
    (exactInputTokens?: number, exactOutputTokens?: number) => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      // Replace estimates with exact counts if available
      const finalOutput = exactOutputTokens ?? outputTokensRef.current;
      const finalInput = exactInputTokens ?? 0;
      const finalTps =
        elapsed > 0 && finalOutput > 0
          ? Math.round(finalOutput / elapsed)
          : 0;

      updateMetrics({
        tokensPerSecond: finalTps,
        outputTokens: finalOutput,
        inputTokens: finalInput,
        contextUsed: finalInput + finalOutput,
      });

      stopStreaming();
    },
    [updateMetrics, stopStreaming]
  );

  return { onStreamStart, onChunk, onStreamEnd };
}
