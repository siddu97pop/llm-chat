import type { ModelInfo, OpenRouterModelsResponse } from "@/lib/types";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * Fetch all available models from OpenRouter.
 * The /models endpoint is public — no auth required.
 */
export async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 }, // cache 5 minutes in Next.js fetch cache
  });

  if (!res.ok) {
    throw new Error(`OpenRouter models fetch failed: ${res.status}`);
  }

  const json: OpenRouterModelsResponse = await res.json();

  return json.data
    .map((m) => {
      const isFree =
        m.pricing.prompt === "0" && m.pricing.completion === "0";
      return {
        id: m.id,
        name: m.name,
        provider: "openrouter" as const,
        contextLength: m.context_length ?? 8192,
        description: m.description,
        isFree,
        pricing: m.pricing,
      };
    })
    .sort((a, b) => {
      // Free models first, then alphabetically
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Build headers for an OpenRouter chat completion request.
 */
export function openRouterHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    // Required by OpenRouter to identify the app
    "HTTP-Referer": "https://chat.lexitools.tech",
    "X-Title": "LLM Chat",
  };
}

/**
 * Build the request body for a streaming OpenRouter chat completion.
 */
export function openRouterBody(
  model: string,
  messages: Array<{ role: string; content: string }>
): string {
  return JSON.stringify({
    model,
    messages,
    stream: true,
    // Includes exact token counts in the final [DONE] chunk
    stream_options: { include_usage: true },
  });
}
