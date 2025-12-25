"use client";

import { Component, ReactNode } from "react";
import { isNonCriticalError, getFriendlyErrorMessage } from "@/utils/errorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    // Ensure error is an Error object, wrap it if not
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'object' && error !== null 
          ? JSON.stringify(error) 
          : String(error));
    
    return { hasError: true, error: errorObj };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // Ensure error is an Error object
    const errorObj = error instanceof Error 
      ? error 
      : new Error(typeof error === 'object' && error !== null 
          ? `Non-Error object caught: ${Object.keys(error).join(', ')}` 
          : String(error));

    // If non-critical error, silently handle (log to console only)
    if (isNonCriticalError(errorObj)) {
      // Reset error state to allow app to continue
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
      return;
    }

    // Only log critical errors
    console.error("[ErrorBoundary] Caught error:", errorObj, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Non-critical errors don't show fallback, let app continue
      // componentDidCatch already set reset, just return children here
      if (isNonCriticalError(this.state.error)) {
        return this.props.children;
      }

      // Critical errors show fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Ensure error message is a string
      const errorMessage = getFriendlyErrorMessage(this.state.error);
      const safeErrorMessage = typeof errorMessage === 'string' 
        ? errorMessage 
        : String(errorMessage);

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
            🚨 An Error Occurred
          </h2>
          <p className="text-red-600 mb-4">
            {safeErrorMessage}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


