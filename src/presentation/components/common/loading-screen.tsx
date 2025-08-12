import React from "react";
import { useI18n } from "@/src/lib/i18n";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
        <p className="text-foreground/70 font-base">
          {message || t("common.loading")}
        </p>
      </div>
    </div>
  );
}
