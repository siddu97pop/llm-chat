import type { ModelInfo, OllamaTagsResponse } from "@/lib/types";

/**
 * Static context window sizes for known Ollama model families.
 * Ollama's /api/tags doesn't return context length — we look it up here.
 * Matched by checking if the model name starts with (or contains) the key.
 */
const OLLAMA_CONTEXT_LENGTHS: Record<string, number> = {
  "llama3.3": 131072,
  "llama3.2": 131072,
  "llama3.1": 131072,
  "llama3": 8192,
  "llama2": 4096,
  "mistral": 32768,
  "mixtral": 32768,
  "gemma3": 131072,
  "gemma2": 8192,
  "gemma": 8192,
  "deepseek-r1": 65536,
  "deepseek-v3": 65536,
  "phi4": 16384,
  "phi3": 131072,
  "phi": 2048,
  "qwen2.5": 131072,
  "qwen2": 32768,
  "qwen": 32768,
  "codellama": 16384,
  "vicuna": 4096,
  "falcon": 2048,
  "command-r": 131072,
  "aya": 8192,
};

const DEFAULT_CONTEXT_LENGTH = 8192;

export function getOllamaContextLength(modelName: string): number {
  const lower = modelName.toLowerCase();
  // Match longest key first to be more specific
  const keys = Object.keys(OLLAMA_CONTEXT_LENGTHS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) {
      return OLLAMA_CONTEXT_LENGTHS[key];
    }
  }
  return DEFAULT_CONTEXT_LENGTH;
}

/**
 * Fetch locally available models from Ollama.
 */
export async function fetchOllamaModels(baseUrl: string): Promise<ModelInfo[]> {
  const res = await fetch(`${baseUrl}/api/tags`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Ollama not reachable at ${baseUrl} (${res.status})`);
  }

  const json: OllamaTagsResponse = await res.json();

  return (json.models ?? []).map((m) => ({
    id: m.name,
    name: m.name,
    provider: "ollama" as const,
    contextLength: getOllamaContextLength(m.name),
    isFree: true,
  }));
}

/**
 * Build the request body for a streaming Ollama chat completion.
 */
export function ollamaBody(
  model: string,
  messages: Array<{ role: string; content: string }>
): string {
  return JSON.stringify({
    model,
    messages,
    stream: true,
  });
}
