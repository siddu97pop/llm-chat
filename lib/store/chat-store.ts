import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Conversation,
  Message,
  ModelInfo,
  Provider,
  AppSettings,
  StreamMetrics,
  Theme,
} from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function newConversation(provider: Provider, modelId: string): Conversation {
  const now = new Date();
  return {
    id: generateId(),
    title: "New conversation",
    messages: [],
    systemPrompt: "",
    provider,
    modelId,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  openrouterApiKey: "",
  ollamaUrl: process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434",
  ollamaApiKey: "",
  selectedProvider: "openrouter",
  selectedModelId: "",
  theme: "system",
  showFreeModelsOnly: true,
};

const DEFAULT_METRICS: StreamMetrics = {
  isStreaming: false,
  tokensPerSecond: 0,
  inputTokens: 0,
  outputTokens: 0,
  contextUsed: 0,
  contextMax: 8192,
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ChatStore {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Model lists (session-only, not persisted)
  models: Record<Provider, ModelInfo[]>;
  modelsLoading: Record<Provider, boolean>;
  modelsError: Record<Provider, string | null>;

  // Settings
  settings: AppSettings;

  // Live stream metrics
  metrics: StreamMetrics;

  // ─── Conversation actions ──────────────────────────────────────────────

  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  updateSystemPrompt: (id: string, systemPrompt: string) => void;

  // ─── Message actions ───────────────────────────────────────────────────

  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => string;
  appendToMessage: (conversationId: string, messageId: string, content: string) => void;
  finalizeMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Pick<Message, "inputTokens" | "outputTokens" | "tokensPerSecond" | "error">>
  ) => void;

  // ─── Model actions ─────────────────────────────────────────────────────

  setModels: (provider: Provider, models: ModelInfo[]) => void;
  setModelsLoading: (provider: Provider, loading: boolean) => void;
  setModelsError: (provider: Provider, error: string | null) => void;

  // ─── Settings actions ──────────────────────────────────────────────────

  setApiKey: (key: string) => void;
  setOllamaUrl: (url: string) => void;
  setOllamaApiKey: (key: string) => void;
  setProvider: (provider: Provider) => void;
  setSelectedModel: (modelId: string) => void;
  setTheme: (theme: Theme) => void;
  setShowFreeModelsOnly: (value: boolean) => void;

  // ─── Metrics actions ───────────────────────────────────────────────────

  startStreaming: (contextMax: number) => void;
  updateMetrics: (partial: Partial<StreamMetrics>) => void;
  stopStreaming: () => void;

  // ─── Derived helpers ───────────────────────────────────────────────────

  getActiveConversation: () => Conversation | null;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      models: { openrouter: [], ollama: [] },
      modelsLoading: { openrouter: false, ollama: false },
      modelsError: { openrouter: null, ollama: null },

      settings: DEFAULT_SETTINGS,
      metrics: DEFAULT_METRICS,

      // ── Conversations ────────────────────────────────────────────────────

      createConversation: () => {
        const { settings } = get();
        const conv = newConversation(settings.selectedProvider, settings.selectedModelId);
        set((state) => ({
          conversations: [conv, ...state.conversations],
          activeConversationId: conv.id,
        }));
        return conv.id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => {
          const remaining = state.conversations.filter((c) => c.id !== id);
          const newActive =
            state.activeConversationId === id
              ? (remaining[0]?.id ?? null)
              : state.activeConversationId;
          return { conversations: remaining, activeConversationId: newActive };
        }),

      clearConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, messages: [], updatedAt: new Date() } : c
          ),
        })),

      updateConversationTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        })),

      updateSystemPrompt: (id, systemPrompt) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, systemPrompt, updatedAt: new Date() } : c
          ),
        })),

      // ── Messages ─────────────────────────────────────────────────────────

      addMessage: (conversationId, message) => {
        const id = generateId();
        const fullMessage: Message = {
          ...message,
          id,
          timestamp: new Date(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, fullMessage], updatedAt: new Date() }
              : c
          ),
        }));
        return id;
      },

      appendToMessage: (conversationId, messageId, content) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, content: m.content + content } : m
                  ),
                }
              : c
          ),
        })),

      finalizeMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        })),

      // ── Models ────────────────────────────────────────────────────────────

      setModels: (provider, models) =>
        set((state) => ({ models: { ...state.models, [provider]: models } })),

      setModelsLoading: (provider, loading) =>
        set((state) => ({ modelsLoading: { ...state.modelsLoading, [provider]: loading } })),

      setModelsError: (provider, error) =>
        set((state) => ({ modelsError: { ...state.modelsError, [provider]: error } })),

      // ── Settings ──────────────────────────────────────────────────────────

      setApiKey: (key) =>
        set((state) => ({ settings: { ...state.settings, openrouterApiKey: key } })),

      setOllamaUrl: (url) =>
        set((state) => ({ settings: { ...state.settings, ollamaUrl: url } })),

      setOllamaApiKey: (key) =>
        set((state) => ({ settings: { ...state.settings, ollamaApiKey: key } })),

      setProvider: (provider) =>
        set((state) => ({ settings: { ...state.settings, selectedProvider: provider } })),

      setSelectedModel: (modelId) =>
        set((state) => ({ settings: { ...state.settings, selectedModelId: modelId } })),

      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),

      setShowFreeModelsOnly: (value) =>
        set((state) => ({ settings: { ...state.settings, showFreeModelsOnly: value } })),

      // ── Metrics ───────────────────────────────────────────────────────────

      startStreaming: (contextMax) =>
        set({
          metrics: {
            ...DEFAULT_METRICS,
            isStreaming: true,
            contextMax,
          },
        }),

      updateMetrics: (partial) =>
        set((state) => ({ metrics: { ...state.metrics, ...partial } })),

      stopStreaming: () =>
        set((state) => ({ metrics: { ...state.metrics, isStreaming: false } })),

      // ── Derived ───────────────────────────────────────────────────────────

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    {
      name: "llm-chat-store",
      // Only persist conversations and settings — never models or transient metrics
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        settings: state.settings,
      }),
    }
  )
);
