"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useSelectedModel,
  AVAILABLE_MODELS,
  type ModelId,
} from "../../stores/chat-settings.store";
import { ChevronDown, Check } from "lucide-react";
import { useI18n } from "@/src/lib/i18n";

interface ModelSelectorProps {
  className?: string;
  showDescription?: boolean;
  compact?: boolean;
}

export function ModelSelector({
  className,
  showDescription = false,
  compact = false,
}: ModelSelectorProps) {
  const { t } = useI18n();
  const { selectedModel, setSelectedModel, model } = useSelectedModel();

  const handleModelSelect = (modelId: ModelId) => {
    setSelectedModel(modelId);
  };

  const modelEntries = Object.entries(AVAILABLE_MODELS) as [
    ModelId,
    (typeof AVAILABLE_MODELS)[ModelId]
  ][];

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="neutral"
            size="sm"
            className="h-8 px-2 text-xs gap-1 mb-1"
            aria-label={t("models.selectAiModel")}
          >
            {model?.icon &&
              React.createElement(model.icon, { className: "h-3 w-3" })}
            <span className="hidden sm:inline">
              {model?.name || t("common.selectModel")}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-w-[90vw]">
          <DropdownMenuLabel>{t("models.selectAiModel")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {modelEntries.map(([modelId, modelInfo]) => (
            <DropdownMenuItem
              key={modelId}
              onClick={() => handleModelSelect(modelId)}
              className="flex-col items-start h-auto py-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {modelInfo?.icon &&
                    React.createElement(modelInfo.icon, {
                      className: "h-4 w-4 shrink-0",
                    })}
                  <div className="font-base text-sm truncate">
                    {modelInfo.name}
                  </div>
                </div>
                {selectedModel === modelId && (
                  <Check className="h-4 w-4 text-main-foreground ml-2 shrink-0" />
                )}
              </div>
              <div className="text-xs text-main-foreground/70 pl-6 w-full break-words">
                {modelInfo.provider} • {modelInfo.description}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <label className="block text-sm font-base text-foreground mb-2">
          {t("models.aiModel")}
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="neutral"
              className="w-full justify-between h-auto p-3"
              aria-label={t("models.selectAiModel")}
            >
              <div className="flex items-center gap-3">
                {model?.icon &&
                  React.createElement(model.icon, { className: "h-4 w-4" })}
                <div className="text-left">
                  <div className="font-base text-sm">
                    {model?.name || t("common.selectModel")}
                  </div>
                  {showDescription && model && (
                    <div className="text-xs text-foreground/60 max-w-[18rem]">
                      <p className="break-words">
                        {model.provider} •{" "}
                        <span
                          className="
                            block
                            overflow-hidden
                            text-ellipsis
                            whitespace-normal
                            break-words
                            max-h-12
                          "
                          style={{ wordBreak: "break-word" }}
                        >
                          {model.description}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <DropdownMenuLabel>{t("models.availableModels")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {modelEntries.map(([modelId, modelInfo]) => (
              <DropdownMenuItem
                key={modelId}
                onClick={() => handleModelSelect(modelId)}
                className="flex items-start gap-3 h-auto py-3 cursor-pointer"
              >
                {modelInfo?.icon &&
                  React.createElement(modelInfo.icon, {
                    className: "h-4 w-4 text-main-foreground shrink-0 mt-0.5",
                  })}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between w-full">
                    <div className="font-base text-sm truncate">
                      {modelInfo.name}
                    </div>
                    {selectedModel === modelId && (
                      <Check className="h-4 w-4 text-main-foreground ml-3 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-main-foreground/70 break-words leading-relaxed">
                    <span className="font-medium">{modelInfo.provider}</span> •{" "}
                    {modelInfo.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
