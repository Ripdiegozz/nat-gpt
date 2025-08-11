import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Code2, Zap, Sparkles, Brain } from "lucide-react";

// Available AI models
export const AVAILABLE_MODELS = {
  // "qwen/qwen-2.5-32b-instruct": {
  //   id: "qwen/qwen-2.5-32b-instruct",
  //   name: "Qwen 2.5 32B",
  //   provider: "Qwen",
  //   description: "Advanced Qwen model for complex reasoning and coding",
  //   free: true,
  //   icon: Code2,
  // },
  // "deepseek/deepseek-r1-distill-llama-70b": {
  //   id: "deepseek/deepseek-r1-distill-llama-70b",
  //   name: "DeepSeek R1 Distill 70B",
  //   provider: "DeepSeek",
  //   description: "Distilled reasoning model based on Llama architecture",
  //   free: true,
  //   icon: Brain,
  // },
  // "google/gemma-2-9b-it": {
  //   id: "google/gemma-2-9b-it",
  //   name: "Gemma 2 9B IT",
  //   provider: "Google",
  //   description: "Instruction-tuned Gemma model for general tasks",
  //   free: true,
  //   icon: Sparkles,
  // },
  "compound-beta": {
    id: "compound-beta",
    name: "Compound Beta",
    provider: "Compound AI",
    description: "Beta experimental model for advanced reasoning",
    free: true,
    icon: Zap,
  },
  // "meta-llama/llama-3.1-8b-instruct": {
  //   id: "meta-llama/llama-3.1-8b-instruct",
  //   name: "Llama 3.1 8B Instant",
  //   provider: "Meta",
  //   description: "Fast and efficient Llama model for quick responses",
  //   free: true,
  //   icon: Brain,
  // },
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
  selectedModel: "compound-beta" as ModelId,
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
    (set) => ({
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

  // Fallback to first available model if current selection is invalid
  const validModel = AVAILABLE_MODELS[selectedModel]
    ? selectedModel
    : (Object.keys(AVAILABLE_MODELS)[0] as ModelId);
  const model = AVAILABLE_MODELS[validModel];

  // Update to valid model if current is invalid
  if (selectedModel !== validModel) {
    setSelectedModel(validModel);
  }

  return {
    selectedModel: validModel,
    setSelectedModel,
    model,
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
