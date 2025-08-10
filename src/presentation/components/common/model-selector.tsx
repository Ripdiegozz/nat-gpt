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
import { ChevronDown, Check, Cpu } from "lucide-react";

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
            aria-label="Select AI model"
          >
            {React.createElement(model.icon, { className: "h-3 w-3" })}
            <span className="hidden sm:inline">{model.name}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {modelEntries.map(([modelId, modelInfo]) => (
            <DropdownMenuItem
              key={modelId}
              onClick={() => handleModelSelect(modelId)}
              className="flex-col items-start h-auto py-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {React.createElement(modelInfo.icon, {
                    className: "h-4 w-4",
                  })}
                  <div className="font-base text-sm truncate">
                    {modelInfo.name}
                  </div>
                </div>
                {selectedModel === modelId && (
                  <Check className="h-4 w-4 text-main-foreground ml-2 shrink-0" />
                )}
              </div>
              <div className="text-xs text-main-foreground/70 truncate pl-6">
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
          AI Model
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="neutral"
              className="w-full justify-between h-auto p-3"
              aria-label="Select AI model"
            >
              <div className="flex items-center gap-3">
                {React.createElement(model.icon, { className: "h-4 w-4" })}
                <div className="text-left">
                  <div className="font-base text-sm">{model.name}</div>
                  {showDescription && (
                    <div className="text-xs text-foreground/60">
                      {model.provider} • {model.description}
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
            <DropdownMenuLabel>Available Models (All Free)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {modelEntries.map(([modelId, modelInfo]) => (
              <DropdownMenuItem
                key={modelId}
                onClick={() => handleModelSelect(modelId)}
                className="flex items-start gap-3 h-auto py-3"
              >
                {React.createElement(modelInfo.icon, {
                  className: "h-4 w-4 text-main-foreground shrink-0 mt-0.5",
                })}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="font-base text-sm">{modelInfo.name}</div>
                    {selectedModel === modelId && (
                      <Check className="h-4 w-4 text-main-foreground ml-3 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-main-foreground/70">
                    {modelInfo.provider} • {modelInfo.description}
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
