"use client";

// Enhanced providers with improved error handling and performance optimizations
import type { ReactNode } from "react";
import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { sepolia, hardhat } from "wagmi/chains";
import { http } from "wagmi";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { isNonCriticalError } from "@/utils/errorHandler";

const config = getDefaultConfig({
  appName: "Weight Trend",
  projectId: "WEIGHT_TREND_FHEVM",
  chains: [sepolia, hardhat],
  ssr: false,
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY || "b18fb7e6ca7045ac83c41157ab93f990"}`),
    [hardhat.id]: http("http://localhost:8545"),
  },
});

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  // Global error handling: silently handle non-critical network errors
  useEffect(() => {
    // Save original console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Override console.error to intercept error output
    console.error = (...args: unknown[]) => {
      // Check if it's a "Failed to fetch" related error
      const errorString = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        if (typeof arg === 'string') {
          return arg;
        }
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }).join(" ");
      
      // Check various possible non-critical error formats
      // Including bundled anonymous function errors, network errors, third-party service errors
      const isNonCritical = 
        errorString.includes("Failed to fetch") ||
        errorString.includes("failed to fetch") ||
        errorString.includes("403") ||
        errorString.includes("400") ||
        errorString.includes("ERR_BLOCKED_BY_RESPONSE") ||
        errorString.includes("NotSameOriginAfterDefaultedToSameOriginByCoep") ||
        errorString.includes("coinbase.com") ||
        errorString.includes("walletconnect") ||
        errorString.includes("web3modal") ||
        errorString.includes("FHEVM operation was cancelled") ||
        errorString.includes("FhevmAbortError") ||
        errorString.includes("operation was cancelled") ||
        (errorString.includes("TypeError") && (
          errorString.includes("fetch") || 
          errorString.includes("Failed") ||
          errorString.includes("<anonymous>") // Bundled code location
        ));
      
      if (isNonCritical) {
        // Completely silent handling, no output
        return;
      }
      
      // Other errors output normally
      originalConsoleError.apply(console, args);
    };

    // Override console.warn to intercept warning output (optional)
    console.warn = (...args: unknown[]) => {
      const warnString = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        return String(arg);
      }).join(" ");

      // Silently handle non-critical warnings
      const isNonCriticalWarn = 
        warnString.includes("Failed to fetch remote project configuration") ||
        warnString.includes("Reown Config") ||
        warnString.includes("Could not load signature") ||
        warnString.includes("Lit is in dev mode") ||
        warnString.includes("React DevTools");
      
      if (isNonCriticalWarn) {
        // Completely silent warning handling
        return;
      }
      
      // Other warnings output normally
      originalConsoleWarn.apply(console, args);
    };

    const handleError = (event: ErrorEvent) => {
      // Ensure error is an Error object, handle special cases like transaction objects
      let error: Error;
      if (event.error instanceof Error) {
        error = event.error;
      } else if (typeof event.error === 'object' && event.error !== null) {
        // Check if it's a transaction object
        if ('hash' in event.error || 'blockNumber' in event.error || 'provider' in event.error) {
          error = new Error("Transaction processing error, please try again");
        } else {
          error = new Error(`Error event with object: ${Object.keys(event.error).join(', ')}`);
        }
      } else {
        error = new Error(event.message || String(event));
      }
      
      // If non-critical error (e.g., Failed to fetch), silently handle
      if (isNonCriticalError(error)) {
        event.preventDefault(); // Prevent default error handling
        event.stopPropagation(); // Stop event propagation
        // No logging, completely silent
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ensure error is an Error object, handle special cases like transaction objects
      let error: Error;
      if (event.reason instanceof Error) {
        error = event.reason;
      } else if (typeof event.reason === 'object' && event.reason !== null) {
        // Check if it's a transaction object
        if ('hash' in event.reason || 'blockNumber' in event.reason || 'provider' in event.reason) {
          error = new Error("Transaction processing error, please try again");
        } else {
          error = new Error(`Promise rejected with object: ${Object.keys(event.reason).join(', ')}`);
        }
      } else {
        error = new Error(String(event.reason));
      }
      
      // If non-critical error, silently handle
      if (isNonCriticalError(error)) {
        event.preventDefault(); // Prevent default error handling
        // No logging, completely silent
        return false;
      }
    };

    window.addEventListener("error", handleError, true); // Use capture phase
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      // Restore original console methods
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

