"use client";

import React from "react";

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

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
          <div className="p-6">
            <div className="max-w-xl mx-auto border-2 border-border rounded-base bg-secondary-background p-6">
              <h2 className="text-lg font-heading mb-2">
                Something went wrong
              </h2>
              <p className="text-sm font-base text-foreground/70">
                {this.state.error?.message ?? "An unexpected error occurred."}
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
