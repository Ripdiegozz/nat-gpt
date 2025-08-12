"use client";

import * as React from "react";
import { Settings, Moon, Sun, Monitor, Languages } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useLanguageSettings,
  type SupportedLanguage,
} from "../../stores/language-settings.store";
import { useI18n } from "@/src/lib/i18n";

export function SettingsDropdown() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const {
    uiLanguage,
    transcriptionLanguage,
    setUILanguage,
    setTranscriptionLanguage,
    getLanguageLabel,
  } = useLanguageSettings();

  const supportedLanguages: SupportedLanguage[] = ["en", "es"];

  const getLanguageFlag = (lang: SupportedLanguage) => {
    return lang === "en" ? "🇺🇸" : "🇪🇸";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="neutral" size="icon" aria-label={t("settings.title")}>
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("settings.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Theme Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="h-4 w-4 mr-2" />
            {t("common.theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={
                theme === "light" ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Sun className="h-4 w-4 mr-2" />
              {t("common.light")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={
                theme === "dark" ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Moon className="h-4 w-4 mr-2" />
              {t("common.dark")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={
                theme === "system" ? "bg-accent text-accent-foreground" : ""
              }
            >
              <Monitor className="h-4 w-4 mr-2" />
              {t("common.system")}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Interface Language - Only EN/ES */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="h-4 w-4 mr-2" />
            {t("common.interfaceLanguage")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setUILanguage(lang)}
                className={
                  uiLanguage === lang ? "bg-accent text-accent-foreground" : ""
                }
              >
                <span className="mr-2">{getLanguageFlag(lang)}</span>
                {getLanguageLabel(lang)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Audio Language - Only EN/ES */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="h-4 w-4 mr-2" />
            {t("common.audioLanguage")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => setTranscriptionLanguage(lang)}
                className={
                  transcriptionLanguage === lang
                    ? "bg-accent text-accent-foreground"
                    : ""
                }
              >
                <span className="mr-2">{getLanguageFlag(lang)}</span>
                {getLanguageLabel(lang)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
