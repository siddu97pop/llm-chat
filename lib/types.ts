// ─── Providers ────────────────────────────────────────────────────────────────

export type Provider = "openrouter" | "ollama";

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ModelInfo {
  id: string;
  name: string;
  provider: Provider;
  contextLength: number;
  description?: string;
  isFree?: boolean;
  // OpenRouter-specific pricing (used to detect free models)
  pricing?: {
    prompt: string;
    completion: string;
  };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  // Set on assistant messages once streaming completes
  inputTokens?: number;
  outputTokens?: number;
  tokensPerSecond?: number;
  error?: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  systemPrompt: string;
  provider: Provider;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Stream Metrics ───────────────────────────────────────────────────────────

export interface StreamMetrics {
  isStreaming: boolean;
  tokensPerSecond: number;
  inputTokens: number;
  outputTokens: number;
  contextUsed: number;   // estimated tokens used (input + output so far)
  contextMax: number;    // model's context window size
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  openrouterApiKey: string;
  ollamaUrl: string;
  selectedProvider: Provider;
  selectedModelId: string;
  theme: Theme;
  showFreeModelsOnly: boolean;
}

// ─── OpenRouter API types ─────────────────────────────────────────────────────

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

// ─── Ollama API types ─────────────────────────────────────────────────────────

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

// ─── Chat API request/response ────────────────────────────────────────────────

export interface ChatRequestBody {
  messages: Array<{ role: MessageRole; content: string }>;
  model: string;
  provider: Provider;
  apiKey?: string;
  ollamaUrl?: string;
}

// ─── SSE stream chunk shapes ──────────────────────────────────────────────────

export interface OpenAIStreamChunk {
  id?: string;
  object?: string;
  choices?: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OllamaStreamChunk {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  // Present on the final chunk when done=true
  eval_count?: number;
  eval_duration?: number;  // nanoseconds
  prompt_eval_count?: number;
}
