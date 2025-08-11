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
import { Input } from "@/components/ui/input";
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
} from "../../stores/chat-settings.store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RotateCcw, Save, ChevronDown, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

interface ChatSettingsPanelProps {
  className?: string;
}

const LANGUAGE_LABELS = {
  en: "English",
  // es: "Español",
} as const;

const THEME_LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ChatSettingsPanel({ className }: ChatSettingsPanelProps) {
  const { resetToDefaults } = useChatSettings();
  const { maxTokens, temperature, setMaxTokens, setTemperature } =
    useModelSettings();
  const { language, setLanguage } = useChatBehaviorSettings();
  const { theme, setTheme } = useTheme();
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
    toast.success("Settings reset to defaults");
  };

  const handleSave = () => {
    toast.success("Settings saved automatically");
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Model Settings</CardTitle>
          <CardDescription>
            Configure the AI model and its parameters for conversations
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
          <CardTitle>Interface Settings</CardTitle>
          <CardDescription>
            Customize the appearance and behavior of the chat interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
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
                    {THEME_LABELS[theme as keyof typeof THEME_LABELS] ||
                      "System"}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>Theme Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="neutral"
                  className="w-full justify-between font-base"
                >
                  {LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS] ||
                    "English"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>Language Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("es")}>
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("fr")}>
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("de")}>
                  Deutsch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("it")}>
                  Italiano
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("pt")}>
                  Português
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Chat Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Behavior</CardTitle>
          <CardDescription>
            Configure how the chat interface behaves and displays content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave">Auto Save Conversations</Label>
              <p className="text-xs text-foreground/60">
                Automatically save conversations as you chat
              </p>
            </div>
            <Button
              variant={autoSave ? "default" : "neutral"}
              size="sm"
              onClick={() => setAutoSave(!autoSave)}
            >
              {autoSave ? "On" : "Off"}
            </Button>
          </div>

          {/* Typing Indicator */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="typingIndicator">Show Typing Indicator</Label>
              <p className="text-xs text-foreground/60">
                Display when the AI is generating a response
              </p>
            </div>
            <Button
              variant={showTypingIndicator ? "default" : "neutral"}
              size="sm"
              onClick={() => setShowTypingIndicator(!showTypingIndicator)}
            >
              {showTypingIndicator ? "On" : "Off"}
            </Button>
          </div>

          {/* Markdown */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="markdown">Enable Markdown</Label>
              <p className="text-xs text-foreground/60">
                Render markdown formatting in messages
              </p>
            </div>
            <Button
              variant={enableMarkdown ? "default" : "neutral"}
              size="sm"
              onClick={() => setEnableMarkdown(!enableMarkdown)}
            >
              {enableMarkdown ? "On" : "Off"}
            </Button>
          </div>

          {/* Code Highlighting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="codeHighlighting">Code Highlighting</Label>
              <p className="text-xs text-foreground/60">
                Syntax highlighting for code blocks
              </p>
            </div>
            <Button
              variant={enableCodeHighlighting ? "default" : "neutral"}
              size="sm"
              onClick={() => setEnableCodeHighlighting(!enableCodeHighlighting)}
            >
              {enableCodeHighlighting ? "On" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button
          variant="neutral"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>

        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Settings Auto-Saved
        </Button>
      </div>
    </div>
  );
}
