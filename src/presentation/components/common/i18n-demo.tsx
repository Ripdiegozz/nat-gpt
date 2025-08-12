"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/src/lib/i18n";
import { useLanguageSettings } from "../../stores/language-settings.store";
import { Globe, Languages } from "lucide-react";

export function I18nDemo() {
  const { t, language, getCurrentLanguage, isLanguage } = useI18n();
  const { setUILanguage, uiLanguage, transcriptionLanguage } = useLanguageSettings();

  const toggleLanguage = () => {
    const newLanguage = uiLanguage === "en" ? "es" : "en";
    setUILanguage(newLanguage);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t("settings.title")} - i18n Demo
        </CardTitle>
        <CardDescription>
          {t("settings.interface.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">
            {t("settings.interface.language")}: {language}
          </div>
          <div className="text-xs text-muted-foreground">
            UI: {uiLanguage} | Transcription: {transcriptionLanguage}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <strong>{t("common.save")}:</strong> {t("common.save")}
          </div>
          <div className="text-sm">
            <strong>{t("common.loading")}:</strong> {t("common.loading")}
          </div>
          <div className="text-sm">
            <strong>{t("chat.newChat")}:</strong> {t("chat.newChat")}
          </div>
        </div>

        <Button 
          onClick={toggleLanguage}
          className="w-full flex items-center gap-2"
        >
          <Languages className="h-4 w-4" />
          {isLanguage("en") ? "Cambiar a Español" : "Switch to English"}
        </Button>

        <div className="text-xs text-muted-foreground">
          Current language: {getCurrentLanguage()}
        </div>
      </CardContent>
    </Card>
  );
}