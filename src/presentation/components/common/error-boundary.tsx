"use client";

import React from "react";
import { useI18n } from "@/src/lib/i18n";

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

function ErrorBoundaryFallback({ error }: { error?: Error }) {
  const { t } = useI18n();

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto border-2 border-border rounded-base bg-secondary-background p-6">
        <h2 className="text-lg font-heading mb-2">
          {t("common.somethingWentWrong")}
        </h2>
        <p className="text-sm font-base text-foreground/70">
          {error?.message ?? t("common.unexpectedError")}
        </p>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorBoundaryFallback error={this.state.error} />
        )
      );
    }
    return this.props.children;
  }
}
