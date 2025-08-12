"use client";

import {
  useLanguageSettings,
  type SupportedLanguage,
} from "@/src/presentation/stores/language-settings.store";
import enTranslations from "./translations/en.json";
import esTranslations from "./translations/es.json";

// Type for nested object keys
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<typeof enTranslations>;

const translations = {
  en: enTranslations,
  es: esTranslations,
} as const;

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce((current: unknown, key: string) => {
    return current && typeof current === "object" && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj);

  return typeof result === "string" ? result : path;
}

export function useI18n() {
  const { uiLanguage } = useLanguageSettings();

  const t = (key: TranslationKey, fallback?: string): string => {
    const translation = getNestedValue(translations[uiLanguage], key);
    return translation || fallback || key;
  };

  const getCurrentLanguage = (): SupportedLanguage => {
    return uiLanguage;
  };

  const isLanguage = (lang: SupportedLanguage): boolean => {
    return uiLanguage === lang;
  };

  return {
    t,
    getCurrentLanguage,
    isLanguage,
    language: uiLanguage,
  };
}

// Export types for better TypeScript support
export type { TranslationKey, SupportedLanguage };
