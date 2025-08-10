import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Code2, Zap, Sparkles, Brain } from "lucide-react";

// Available AI models
export const AVAILABLE_MODELS = {
  "qwen/qwen3-coder:free": {
    id: "qwen/qwen3-coder:free",
    name: "Qwen 3 Coder",
    provider: "Qwen",
    description: "Fast coding assistant with excellent performance",
    free: true,
    icon: Code2,
  },
  "openai/gpt-oss-20b:free": {
    id: "openai/gpt-oss-20b:free",
    name: "GPT OSS 20B",
    provider: "OpenAI",
    description: "Open source GPT model for general tasks",
    free: true,
    icon: Zap,
  },
  "google/gemini-2.0-flash-exp:free": {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Experimental fast Gemini model",
    free: true,
    icon: Sparkles,
  },
  "tngtech/deepseek-r1t2-chimera:free": {
    id: "tngtech/deepseek-r1t2-chimera:free",
    name: "DeepSeek Chimera",
    provider: "TNG Tech",
    description: "Advanced reasoning model for complex tasks",
    free: true,
    icon: Brain,
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

// Chat settings interface
interface ChatSettings {
  // AI Model settings
  selectedModel: ModelId;
  maxTokens: number;
  temperature: number;

  // UI settings
  language: string;
  sidebarCollapsed: boolean;

  // Chat behavior settings
  autoSave: boolean;
  showTypingIndicator: boolean;
  enableMarkdown: boolean;
  enableCodeHighlighting: boolean;

  // Actions
  setSelectedModel: (model: ModelId) => void;
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setLanguage: (language: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAutoSave: (autoSave: boolean) => void;
  setShowTypingIndicator: (show: boolean) => void;
  setEnableMarkdown: (enable: boolean) => void;
  setEnableCodeHighlighting: (enable: boolean) => void;

  // Bulk actions
  updateSettings: (
    settings: Partial<Omit<ChatSettings, keyof ChatSettingsActions>>
  ) => void;
  resetToDefaults: () => void;
}

type ChatSettingsActions = {
  setSelectedModel: (model: ModelId) => void;
  setMaxTokens: (tokens: number) => void;
  setTemperature: (temp: number) => void;
  setLanguage: (language: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAutoSave: (autoSave: boolean) => void;
  setShowTypingIndicator: (show: boolean) => void;
  setEnableMarkdown: (enable: boolean) => void;
  setEnableCodeHighlighting: (enable: boolean) => void;
  updateSettings: (
    settings: Partial<Omit<ChatSettings, keyof ChatSettingsActions>>
  ) => void;
  resetToDefaults: () => void;
};

// Default settings
const DEFAULT_SETTINGS = {
  selectedModel: "qwen/qwen3-coder:free" as ModelId,
  maxTokens: 4096,
  temperature: 0.7,
  language: "en",
  sidebarCollapsed: false,
  autoSave: true,
  showTypingIndicator: true,
  enableMarkdown: true,
  enableCodeHighlighting: true,
};

// Create the store with persistence
export const useChatSettings = create<ChatSettings>()(
  persist(
    (set, get) => ({
      // Default state
      ...DEFAULT_SETTINGS,

      // Actions
      setSelectedModel: (model: ModelId) => set({ selectedModel: model }),

      setMaxTokens: (tokens: number) =>
        set({ maxTokens: Math.max(100, Math.min(tokens, 32000)) }),

      setTemperature: (temp: number) =>
        set({ temperature: Math.max(0, Math.min(temp, 2)) }),

      setLanguage: (language: string) => set({ language }),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setAutoSave: (autoSave: boolean) => set({ autoSave }),

      setShowTypingIndicator: (show: boolean) =>
        set({ showTypingIndicator: show }),

      setEnableMarkdown: (enable: boolean) => set({ enableMarkdown: enable }),

      setEnableCodeHighlighting: (enable: boolean) =>
        set({ enableCodeHighlighting: enable }),

      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),

      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "chat-settings", // Storage key
      // Only persist the settings, not the actions
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        maxTokens: state.maxTokens,
        temperature: state.temperature,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        autoSave: state.autoSave,
        showTypingIndicator: state.showTypingIndicator,
        enableMarkdown: state.enableMarkdown,
        enableCodeHighlighting: state.enableCodeHighlighting,
      }),
    }
  )
);

// Utility hooks for specific settings
export const useSelectedModel = () => {
  const selectedModel = useChatSettings((state) => state.selectedModel);
  const setSelectedModel = useChatSettings((state) => state.setSelectedModel);
  return {
    selectedModel,
    setSelectedModel,
    model: AVAILABLE_MODELS[selectedModel],
  };
};

export const useModelSettings = () => {
  const {
    selectedModel,
    maxTokens,
    temperature,
    setSelectedModel,
    setMaxTokens,
    setTemperature,
  } = useChatSettings();
  return {
    selectedModel,
    maxTokens,
    temperature,
    setSelectedModel,
    setMaxTokens,
    setTemperature,
    model: AVAILABLE_MODELS[selectedModel],
  };
};

export const useUISettings = () => {
  const { language, sidebarCollapsed, setLanguage, setSidebarCollapsed } =
    useChatSettings();
  return {
    language,
    sidebarCollapsed,
    setLanguage,
    setSidebarCollapsed,
  };
};

export const useChatBehaviorSettings = () => {
  const {
    language,
    autoSave,
    showTypingIndicator,
    enableMarkdown,
    enableCodeHighlighting,
    setLanguage,
    setAutoSave,
    setShowTypingIndicator,
    setEnableMarkdown,
    setEnableCodeHighlighting,
  } = useChatSettings();

  return {
    language,
    autoSave,
    showTypingIndicator,
    enableMarkdown,
    enableCodeHighlighting,
    setLanguage,
    setAutoSave,
    setShowTypingIndicator,
    setEnableMarkdown,
    setEnableCodeHighlighting,
  };
};
