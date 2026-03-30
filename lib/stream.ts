import type { OpenAIStreamChunk, OllamaStreamChunk } from "@/lib/types";

/**
 * Async generator that reads a Response body as a stream and yields
 * complete SSE event strings (the raw data after "data: ").
 *
 * Critical detail: network chunks do NOT align with SSE line boundaries.
 * A single `data: {...}\n\n` event can arrive split across multiple reads,
 * or multiple events can arrive in one read. We maintain a string buffer
 * and only emit complete events.
 */
export async function* readSSEStream(
  response: Response
): AsyncGenerator<string> {
  if (!response.body) throw new Error("Response has no body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const parts = buffer.split("\n\n");

      // The last element may be an incomplete event — keep it in the buffer
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        for (const line of trimmed.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data) yield data;
          }
        }
      }
    }

    // Flush any remaining buffer content after stream ends
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data) yield data;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse a single SSE data string as an OpenAI-compatible chunk.
 * Returns null for [DONE] sentinel and unparseable data.
 */
export function parseOpenAIChunk(data: string): OpenAIStreamChunk | null {
  if (data === "[DONE]") return null;
  try {
    return JSON.parse(data) as OpenAIStreamChunk;
  } catch {
    return null;
  }
}

/**
 * Parse a single SSE data string as an Ollama chunk.
 * Returns null for unparseable data.
 */
export function parseOllamaChunk(data: string): OllamaStreamChunk | null {
  try {
    return JSON.parse(data) as OllamaStreamChunk;
  } catch {
    return null;
  }
}

/**
 * Extract the text delta from an OpenAI-compatible stream chunk.
 */
export function getOpenAIDelta(chunk: OpenAIStreamChunk): string {
  return chunk.choices?.[0]?.delta?.content ?? "";
}

/**
 * Rough token count estimate for text.
 * Used for live context-usage tracking when exact counts aren't available yet.
 * Rule of thumb: ~4 characters per token for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
