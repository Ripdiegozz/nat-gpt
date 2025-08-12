"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModelSelector } from "../common/model-selector";
import {
  useChatSettings,
  useModelSettings,
  useChatBehaviorSettings,
  useAudioSettings,
  AVAILABLE_VOICES,
  type VoiceId,
} from "../../stores/chat-settings.store";
import { useLanguageSettings } from "../../stores/language-settings.store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RotateCcw, Save, ChevronDown, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/src/lib/i18n";

interface ChatSettingsPanelProps {
  className?: string;
}



const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ChatSettingsPanel({ className }: ChatSettingsPanelProps) {
  const { t } = useI18n();
  const { resetToDefaults } = useChatSettings();
  const { maxTokens, temperature, setMaxTokens, setTemperature } =
    useModelSettings();
  const { theme, setTheme } = useTheme();
  const { selectedVoice, enableTTS, setSelectedVoice, setEnableTTS } =
    useAudioSettings();

  // Use the new language settings system
  const {
    uiLanguage,
    transcriptionLanguage,
    setUILanguage,
    setTranscriptionLanguage,
    getLanguageLabel,
  } = useLanguageSettings();
  const {
    autoSave,
    showTypingIndicator,
    enableMarkdown,
    enableCodeHighlighting,
    setAutoSave,
    setShowTypingIndicator,
    setEnableMarkdown,
    setEnableCodeHighlighting,
  } = useChatBehaviorSettings();

  const handleReset = () => {
    resetToDefaults();
    toast.success(t("settings.actions.settingsReset"));
  };

  const handleSave = () => {
    toast.success(t("settings.actions.settingsSaved"));
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.aiModel.title")}</CardTitle>
          <CardDescription>
            {t("settings.aiModel.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Selector */}
          <ModelSelector showDescription />

          {/* Max Tokens */}
          {/* <div className="space-y-2">
            <Label htmlFor="maxTokens">
              Max Tokens: {maxTokens.toLocaleString()}
            </Label>
            <Input
              id="maxTokens"
              type="range"
              min="100"
              max="32000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-foreground/60">
              <span>100</span>
              <span>32,000</span>
            </div>
            <p className="text-xs text-foreground/60">
              Maximum number of tokens in the AI response. Higher values allow
              longer responses but use more resources.
            </p>
          </div> */}

          {/* Temperature */}
          {/* <div className="space-y-2">
            <Label htmlFor="temperature">Temperature: {temperature}</Label>
            <Input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-foreground/60">
              <span>0.0 (Precise)</span>
              <span>2.0 (Creative)</span>
            </div>
            <p className="text-xs text-foreground/60">
              Controls randomness in AI responses. Lower values are more focused
              and deterministic.
            </p>
          </div> */}
        </CardContent>
      </Card>

      {/* UI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.interface.title")}</CardTitle>
          <CardDescription>
            {t("settings.interface.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">{t("settings.interface.theme")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="neutral"
                  className="w-full justify-between font-base"
                >
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      THEME_ICONS[theme as keyof typeof THEME_ICONS] || Sun,
                      {
                        className: "h-4 w-4",
                      }
                    )}
                    {theme === "light" ? t("settings.interface.light") : 
                     theme === "dark" ? t("settings.interface.dark") : 
                     t("settings.interface.system")}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>{t("settings.interface.themeOptions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className={
                    theme === "light" ? "bg-accent text-accent-foreground" : ""
                  }
                >
                  <Sun className="h-4 w-4 mr-2" />
                  {t("settings.interface.light")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className={
                    theme === "dark" ? "bg-accent text-accent-foreground" : ""
                  }
                >
                  <Moon className="h-4 w-4 mr-2" />
                  {t("settings.interface.dark")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className={
                    theme === "system" ? "bg-accent text-accent-foreground" : ""
                  }
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  {t("settings.interface.system")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Interface Language */}
          <div className="space-y-2">
            <Label htmlFor="language">{t("settings.interface.language")}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="neutral"
                  className="w-full justify-between font-base"
                >
                  <div className="flex items-center gap-2">
                    <span>{uiLanguage === "en" ? "🇺🇸" : "🇪🇸"}</span>
                    {getLanguageLabel(uiLanguage)}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>{t("settings.interface.languageOptions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setUILanguage("en")}
                  className={
                    uiLanguage === "en"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setUILanguage("es")}
                  className={
                    uiLanguage === "es"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  🇪🇸 Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.audio.title")}</CardTitle>
          <CardDescription>
            {t("settings.audio.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable TTS */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableTTS">{t("settings.audio.enableTTS")}</Label>
              <p className="text-sm text-foreground/70">
                {t("settings.audio.enableTTSDescription")}
              </p>
            </div>
            <Button
              variant={enableTTS ? "default" : "neutral"}
              size="sm"
              onClick={() => setEnableTTS(!enableTTS)}
              className="min-w-[60px]"
            >
              {enableTTS ? t("common.on") : t("common.off")}
            </Button>
          </div>

          {/* Voice Selection */}
          {enableTTS && (
            <div className="space-y-2">
              <Label htmlFor="voice">{t("settings.audio.voice")}</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="neutral"
                    className="w-full justify-between font-base"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-main"></div>
                      {AVAILABLE_VOICES[selectedVoice]?.name} (
                      {AVAILABLE_VOICES[selectedVoice]?.gender})
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuLabel>{t("settings.audio.voiceOptions")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(AVAILABLE_VOICES).map(([voiceId, voice]) => (
                    <DropdownMenuItem
                      key={voiceId}
                      onClick={() => setSelectedVoice(voiceId as VoiceId)}
                      className={cn(
                        "flex items-center justify-between",
                        selectedVoice === voiceId
                          ? "bg-accent text-accent-foreground"
                          : ""
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            voice.gender === "male"
                              ? "bg-blue-500"
                              : "bg-pink-500"
                          )}
                        ></div>
                        <span>{voice.name}</span>
                      </div>
                      <span className="text-xs text-foreground/70 capitalize">
                        {voice.gender}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-foreground/70">
                {AVAILABLE_VOICES[selectedVoice]?.description}
              </p>
            </div>
          )}

          {/* Transcription Language */}
          <div className="space-y-2">
            <Label htmlFor="transcriptionLanguage">
              {t("settings.audio.transcriptionLanguage")}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="neutral"
                  className="w-full justify-between font-base"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{transcriptionLanguage === "en" ? "🇺🇸" : "🇪🇸"}</span>
                    {getLanguageLabel(transcriptionLanguage)}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>{t("settings.interface.languageOptions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTranscriptionLanguage("en")}
                  className={cn(
                    "flex items-center justify-between",
                    transcriptionLanguage === "en"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>🇺🇸 English</span>
                  </div>
                  <span className="text-xs text-foreground/70">en</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTranscriptionLanguage("es")}
                  className={cn(
                    "flex items-center justify-between",
                    transcriptionLanguage === "es"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>🇪🇸 Español</span>
                  </div>
                  <span className="text-xs text-foreground/70">es</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-xs text-foreground/70">
              {transcriptionLanguage === "en"
                ? t("settings.audio.englishTranscription")
                : t("settings.audio.spanishTranscription")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chat Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.chatBehavior.title")}</CardTitle>
          <CardDescription>
            {t("settings.chatBehavior.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave">{t("settings.chatBehavior.autoSave")}</Label>
              <p className="text-xs text-foreground/60">
                {t("settings.chatBehavior.autoSaveDescription")}
              </p>
            </div>
            <Button
              variant={autoSave ? "default" : "neutral"}
              size="sm"
              onClick={() => setAutoSave(!autoSave)}
            >
              {autoSave ? t("common.on") : t("common.off")}
            </Button>
          </div>

          {/* Typing Indicator */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="typingIndicator">{t("settings.chatBehavior.typingIndicator")}</Label>
              <p className="text-xs text-foreground/60">
                {t("settings.chatBehavior.typingIndicatorDescription")}
              </p>
            </div>
            <Button
              variant={showTypingIndicator ? "default" : "neutral"}
              size="sm"
              onClick={() => setShowTypingIndicator(!showTypingIndicator)}
            >
              {showTypingIndicator ? t("common.on") : t("common.off")}
            </Button>
          </div>

          {/* Markdown */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="markdown">{t("settings.chatBehavior.markdown")}</Label>
              <p className="text-xs text-foreground/60">
                {t("settings.chatBehavior.markdownDescription")}
              </p>
            </div>
            <Button
              variant={enableMarkdown ? "default" : "neutral"}
              size="sm"
              onClick={() => setEnableMarkdown(!enableMarkdown)}
            >
              {enableMarkdown ? t("common.on") : t("common.off")}
            </Button>
          </div>

          {/* Code Highlighting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="codeHighlighting">{t("settings.chatBehavior.codeHighlighting")}</Label>
              <p className="text-xs text-foreground/60">
                {t("settings.chatBehavior.codeHighlightingDescription")}
              </p>
            </div>
            <Button
              variant={enableCodeHighlighting ? "default" : "neutral"}
              size="sm"
              onClick={() => setEnableCodeHighlighting(!enableCodeHighlighting)}
            >
              {enableCodeHighlighting ? t("common.on") : t("common.off")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row pb-2 md:pb-0 justify-between gap-4">
        <Button
          variant="neutral"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {t("settings.actions.resetToDefaults")}
        </Button>

        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {t("settings.actions.settingsAutoSaved")}
        </Button>
      </div>
    </div>
  );
}
