"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguageSettings, type SupportedLanguage } from "../../stores/language-settings.store";
import { Languages } from "lucide-react";
import { useI18n } from "@/src/lib/i18n";

interface LanguageSelectorProps {
  type: "transcription" | "ui";
  className?: string;
}

export function LanguageSelector({ type, className }: LanguageSelectorProps) {
  const { t } = useI18n();
  const {
    transcriptionLanguage,
    uiLanguage,
    setTranscriptionLanguage,
    setUILanguage,
    getLanguageLabel,
  } = useLanguageSettings();

  const currentLanguage = type === "transcription" ? transcriptionLanguage : uiLanguage;
  const setLanguage = type === "transcription" ? setTranscriptionLanguage : setUILanguage;

  const handleLanguageChange = (value: string) => {
    setLanguage(value as SupportedLanguage);
  };

  const supportedLanguages: SupportedLanguage[] = ["en", "es"];

  return (
    <div className={className}>
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <Languages className="h-4 w-4" />
        {type === "transcription" ? t("settings.audio.transcriptionLanguage") : t("settings.interface.language")}
      </Label>
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full mt-1">
          <SelectValue placeholder={t("settings.interface.languageOptions")} />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {lang === "en" ? "🇺🇸" : "🇪🇸"}
                </span>
                {getLanguageLabel(lang)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
