"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SupportedLanguage = "en" | "es";

export interface LanguageSettings {
  transcriptionLanguage: SupportedLanguage;
  uiLanguage: SupportedLanguage;
}

interface LanguageSettingsStore extends LanguageSettings {
  setTranscriptionLanguage: (language: SupportedLanguage) => void;
  setUILanguage: (language: SupportedLanguage) => void;
  getLanguageLabel: (language: SupportedLanguage) => string;
  getTranscriptionCode: (language: SupportedLanguage) => string;
}

export const useLanguageSettings = create<LanguageSettingsStore>()(
  persist(
    (set) => ({
      // Default settings
      transcriptionLanguage: "en",
      uiLanguage: "en",

      // Actions
      setTranscriptionLanguage: (language: SupportedLanguage) =>
        set({ transcriptionLanguage: language }),

      setUILanguage: (language: SupportedLanguage) =>
        set({ uiLanguage: language }),

      // Helper functions
      getLanguageLabel: (language: SupportedLanguage) => {
        const labels = {
          en: "English",
          es: "Español",
        };
        return labels[language];
      },

      getTranscriptionCode: (language: SupportedLanguage) => {
        const codes = {
          en: "en",
          es: "es",
        };
        return codes[language];
      },
    }),
    {
      name: "language-settings",
      version: 1,
    }
  )
);