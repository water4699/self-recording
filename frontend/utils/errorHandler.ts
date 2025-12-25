/**
 * Enhanced error handling utility functions
 * Convert technical errors to user-friendly messages with better categorization
 */

// Enhanced error categorization for different error types
export function categorizeError(error: Error | unknown): 'network' | 'contract' | 'user' | 'unknown' {
  const errorString = error instanceof Error ? error.message : String(error);

  if (errorString.includes('Failed to fetch') || errorString.includes('network') || errorString.includes('timeout')) {
    return 'network';
  }
  if (errorString.includes('revert') || errorString.includes('execution') || errorString.includes('gas')) {
    return 'contract';
  }
  if (errorString.includes('user') || errorString.includes('denied') || errorString.includes('cancelled')) {
    return 'user';
  }
  return 'unknown';
}

export function getFriendlyErrorMessage(error: Error | unknown): string {
  if (!error) return "An unknown error occurred";

  // If error is an object (like transaction object), convert to string
  if (typeof error === 'object' && error !== null && !(error instanceof Error)) {
    // Check if it's a transaction object
    if ('hash' in error || 'blockNumber' in error || 'provider' in error) {
      return "Transaction processing error, please try again";
    }
    // Convert other objects to string
    try {
      return `Error: ${JSON.stringify(error).substring(0, 200)}`;
    } catch {
      return `Error: ${Object.keys(error).join(', ')}`;
    }
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "";

  // Handle network-related errors
  if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("NetworkError") ||
    errorName === "TypeError" && errorMessage.includes("fetch")
  ) {
    return "Network connection failed, please check your network connection or try again later";
  }

  // Handle RPC-related errors
  if (
    errorMessage.includes("RPC") ||
    errorMessage.includes("Web3 node") ||
    errorMessage.includes("not reachable")
  ) {
    if (errorMessage.includes("localhost:8545") || errorMessage.includes("127.0.0.1:8545")) {
      return "Unable to connect to local Hardhat node, please ensure 'npx hardhat node' is running";
    }
    return "Unable to connect to blockchain network, please check network configuration";
  }

  // Handle FHEVM SDK loading errors
  if (
    errorMessage.includes("RelayerSDK") ||
    errorMessage.includes("FHEVM") ||
    errorMessage.includes("SDK")
  ) {
    return "FHEVM SDK loading failed, please refresh the page and try again";
  }

  // Handle FHEVM Relayer errors
  if (
    errorMessage.includes("Relayer") ||
    errorMessage.includes("relayer") ||
    errorMessage.includes("Bad JSON") ||
    errorMessage.includes("ERR_CONNECTION_CLOSED") ||
    errorMessage.includes("testnet.zama")
  ) {
    return "FHEVM Relayer service is temporarily unavailable. Please try again later or use local Hardhat network for testing";
  }

  // Handle timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
    return "Request timeout, please try again later";
  }

  // Return original error message if not too technical
  if (errorMessage.length < 100) {
    return errorMessage;
  }

  return "Operation failed, please try again later";
}

/**
 * Check if error is non-critical (can be silently handled)
 */
export function isNonCriticalError(error: Error | unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "";
  const errorString = String(error);
  
  // These errors usually don't affect core functionality and can be silently handled
  const nonCriticalPatterns = [
    "Failed to fetch",
    "fetch failed",
    "NetworkError",
    "aborted",
    "RelayerSDK",
    "TypeError", // TypeError is usually network-related
    "403", // HTTP 403 error (e.g., web3modal, walletconnect)
    "400", // HTTP 400 error (e.g., walletconnect)
    "ERR_BLOCKED_BY_RESPONSE", // COEP policy error
    "NotSameOriginAfterDefaultedToSameOriginByCoep", // COEP-related error
    "coinbase.com", // Coinbase-related error
    "walletconnect", // WalletConnect-related error
    "web3modal", // Web3Modal-related error
    "FHEVM operation was cancelled", // FHEVM normal cancellation
    "FhevmAbortError", // FHEVM cancellation error
    "operation was cancelled", // Generic cancellation
    "Relayer", // Relayer-related errors
    "relayer", // Relayer-related errors
    "ERR_CONNECTION_CLOSED", // Connection closed errors
    "testnet.zama", // Zama testnet errors
  ];

  // Check error message
  const messageMatches = nonCriticalPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorString.includes(pattern)
  );

  // Special handling for TypeError: Failed to fetch
  if (errorName === "TypeError" && (
    errorMessage.includes("fetch") || 
    errorString.includes("fetch") ||
    errorMessage === "" || // Sometimes error message is empty but type is TypeError
    errorString.includes("Failed")
  )) {
    return true;
  }

  return messageMatches;
}

/**
 * Silently handle non-critical errors (log to console only, don't throw)
 */
export function handleNonCriticalError(error: Error | unknown, context?: string): void {
  if (isNonCriticalError(error)) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    console.log(
      `[Non-critical error${context ? ` - ${context}` : ""}] ${friendlyMessage}`
    );
    return;
  }
  
  // Critical errors are still thrown
  throw error;
}


