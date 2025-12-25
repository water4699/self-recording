"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useEthersSigner, useEthersProvider } from "@/hooks/useEthersSigner";
import { useWeightTrend } from "@/hooks/useWeightTrend";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useAccount, useChainId } from "wagmi";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import './WeightTrendDemo.css';

export const WeightTrendDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const ethersSigner = useEthersSigner({ chainId });
  const ethersReadonlyProvider = useEthersProvider({ chainId });

  const [weightInput, setWeightInput] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get provider from wagmi
  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    // Use window.ethereum if available, otherwise use wagmi's publicClient
    const win = window as typeof window & { ethereum?: unknown };
    if (win.ethereum) {
      return win.ethereum;
    }
    return undefined;
  }, []);

  const {
    instance: fhevmInstance,
  } = useFhevm({
    provider: provider,
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: true,
  });

  const sameChainRef = useRef((c: number | undefined) => c === chainId);
  const sameSignerRef = useRef((s: { address?: string } | undefined) => s?.address === address);

  const weightTrend = useWeightTrend({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain: sameChainRef,
    sameSigner: sameSignerRef,
  });

  const showNotification = useCallback((message: string, duration = 3000) => {
    setNotificationMessage(message);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), duration);
  }, []);

  const handleSubmitWeight = useCallback(() => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0 || weight > 1000) {
      showNotification("Please enter a valid weight between 0.1 and 1000 kg", 4000);
      return;
    }
    weightTrend.submitWeight(Math.round(weight * 10)); // Convert to integer (store as 0.1kg precision)
    setWeightInput("");
    showNotification(`Weight ${weight} kg submitted successfully!`, 2000);
  }, [weightInput, weightTrend, showNotification]);

  // Show consistent structure during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="weight-trend-app">
        <div className="weight-trend-main">
          <div className="weight-trend-card">
            <h2 className="card-title">⚖️ Encrypted Weight Trend System</h2>
            <p style={{ color: '#94a3b8' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="weight-trend-app">
        <div className="weight-trend-main">
          <div className="connect-message">
            <h2>🔗 Connect Your Wallet</h2>
            <p>Please connect your wallet to start tracking your weight</p>
            <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
              Use the Connect button in the header
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (weightTrend.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitWeight();
    }
  };

  return (
    <div className="weight-trend-app">
      {/* Notification System */}
      {isNotificationVisible && (
        <div className="notification-banner">
          <div className="notification-content">
            <span className="notification-icon">ℹ️</span>
            <span className="notification-text">{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="weight-trend-main">
        {/* Hero Section */}
        <section className="hero-section">
          <span className="hero-tagline">Privacy-First Health Tracking</span>
          <h1 className="hero-title">Your Health, <br />Only for Your Eyes.</h1>
          <p className="hero-description">
            Experience the first weight tracking system powered by 
            <strong> Fully Homomorphic Encryption (FHE)</strong>. 
            Store, track, and analyze your data with mathematical certainty of privacy.
          </p>
        </section>

        {/* How It Works Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔐</span>
            <h3 className="feature-title">Local Encryption</h3>
            <p className="feature-text">Your data is encrypted right in your browser. Raw values never leave your device.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🧠</span>
            <h3 className="feature-title">FHE Computations</h3>
            <p className="feature-text">The blockchain performs trends and analytics on encrypted data without ever seeing the numbers.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🛡️</span>
            <h3 className="feature-title">Full Sovereignty</h3>
            <p className="feature-text">Only your wallet can request to view cleartext results. Your data remains your own.</p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="weight-trend-card">
          <h2 className="card-title">🛡️ About the Protocol</h2>
          <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
            Welcome to the future of private health tracking. This protocol uses Zama's FHEVM technology to ensure that your sensitive health data is protected by the same security standards used in high-stakes financial systems.
          </p>
        </div>

        {/* Chain & Contract Info Card */}
        <div className="weight-trend-card info-card">
          <h2 className="card-title">⛓️ Network Status</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Network ID</div>
              <div className="stat-value info">{chainId}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Wallet Address</div>
              <div className="stat-value info" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Contract Protocol</div>
              <div className="stat-value info" style={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {weightTrend.contractAddress?.slice(0, 6)}...{weightTrend.contractAddress?.slice(-4)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Availability</div>
              <div className={`status-indicator ${weightTrend.isDeployed ? 'status-success' : 'status-error'}`}>
                {weightTrend.isDeployed ? 'Active & Ready' : 'System Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Weight Card */}
        <div className="weight-trend-card action-card">
          <h2 className="card-title">⚖️ Input Measurement</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Enter your current weight. It will be 
            <span style={{ color: '#fbbf24', fontWeight: '600' }}> encrypted instantly </span> 
            locally before being sent to the blockchain coprocessor.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: 72.5"
              className="weight-input"
              min="0"
              max="1000"
              step="0.1"
            />
            <button
              className={`weight-trend-button button-primary ${!weightTrend.canSubmitWeight || !weightInput || weightTrend.isSubmitting ? 'button-disabled' : ''} ${weightTrend.isSubmitting ? 'button-loading' : ''}`}
              disabled={!weightTrend.canSubmitWeight || !weightInput || weightTrend.isSubmitting}
              onClick={handleSubmitWeight}
            >
              {weightTrend.isSubmitting
                ? "Encrypting..."
                : "Submit Securely"}
            </button>
          </div>
        </div>

        {/* Today's Weight Card */}
        <div className="weight-trend-card action-card">
          <h2 className="card-title">📅 Current Recording</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Privacy Handle (Ciphertext)</div>
              <div className="stat-value encrypted">
                {typeof weightTrend.todayWeightHandle === 'string' 
                  ? weightTrend.todayWeightHandle.slice(0, 24) + '...'
                  : weightTrend.todayWeightHandle 
                    ? String(weightTrend.todayWeightHandle).slice(0, 24) + '...'
                    : '🔒 Secured'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Cleartext Value</div>
              <div className={`stat-value ${weightTrend.isTodayWeightDecrypted ? 'success' : ''}`}>
                {weightTrend.isTodayWeightDecrypted
                  ? `✅ ${Number(weightTrend.clearTodayWeight) / 10} kg`
                  : '🔐 Encrypted on Chain'}
              </div>
            </div>
          </div>
          <div className="button-group">
            <button
              className={`weight-trend-button button-secondary ${!weightTrend.canGetTodayWeight ? 'button-disabled' : ''}`}
              disabled={!weightTrend.canGetTodayWeight}
              onClick={weightTrend.refreshTodayWeight}
            >
              🔄 Refresh Data
            </button>
            <button
              className={`weight-trend-button button-success ${!weightTrend.canDecryptTodayWeight ? 'button-disabled' : ''}`}
              disabled={!weightTrend.canDecryptTodayWeight}
              onClick={weightTrend.decryptTodayWeight}
            >
              {weightTrend.canDecryptTodayWeight
                ? "🔓 Reveal My Weight"
                : weightTrend.isTodayWeightDecrypted
                  ? "✨ Decrypted"
                  : weightTrend.isDecrypting
                    ? "⏳ Decrypting..."
                    : "🔒 Locked"}
            </button>
          </div>
        </div>

        {/* Weight Trend Comparison Card */}
        <div className="weight-trend-card action-card">
          <h2 className="card-title">📈 Analytics Insight</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Encrypted Comparison</div>
              <div className="stat-value encrypted">
                {typeof weightTrend.trendHandle === 'string' 
                  ? weightTrend.trendHandle.slice(0, 24) + '...'
                  : weightTrend.trendHandle 
                    ? String(weightTrend.trendHandle).slice(0, 24) + '...'
                    : '🔒 No Analytics yet'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Privacy-Preserving Trend</div>
              <div className={`stat-value ${weightTrend.isTrendDecrypted 
                ? (weightTrend.clearTrend ? 'success' : 'error')
                : ''}`}>
                {weightTrend.isTrendDecrypted
                  ? weightTrend.clearTrend
                    ? "📉 Weight Decreased"
                    : "📈 Upward or Stable"
                  : '🔍 Needs Decryption'}
              </div>
            </div>
          </div>
          <div className="button-group">
            <button
              className={`weight-trend-button button-primary ${!weightTrend.canCompareTrend ? 'button-disabled' : ''}`}
              disabled={!weightTrend.canCompareTrend}
              onClick={weightTrend.compareTrend}
            >
              ⚡ Run Private Comparison
            </button>
            <button
              className={`weight-trend-button button-success ${!weightTrend.canDecryptTrend ? 'button-disabled' : ''}`}
              disabled={!weightTrend.canDecryptTrend}
              onClick={weightTrend.decryptTrend}
            >
              {weightTrend.canDecryptTrend
                ? "🔓 See Result"
                : weightTrend.isTrendDecrypted
                  ? "✨ Viewable"
                  : weightTrend.isDecrypting
                    ? "⏳ Computing..."
                    : "🔒 Private"}
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="weight-trend-card">
          <h2 className="card-title">💡 Privacy & Health Tips</h2>
          <div className="tips-section">
            <div className="tip-card">
              <div className="tip-header">✦ Privacy Tip</div>
              <p className="tip-text">Always ensure you're connected to the official Sepolia testnet to maintain data integrity.</p>
            </div>
            <div className="tip-card">
              <div className="tip-header">✦ Health Tip</div>
              <p className="tip-text">Consistency is key. Try recording your weight at the same time every morning for better trends.</p>
            </div>
            <div className="tip-card">
              <div className="tip-header">✦ FHE Insight</div>
              <p className="tip-text">FHE allows processing data without decryption, making it the gold standard for health privacy.</p>
            </div>
          </div>
        </div>

        {/* Message Card */}
        <div className="weight-trend-card">
          <h2 className="card-title">💬 System Logs</h2>
          <div className="message-display">
            {typeof weightTrend.message === 'string' 
              ? weightTrend.message 
              : weightTrend.message 
                ? String(weightTrend.message) 
                : "System operational. Waiting for user interaction..."}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <span className="footer-logo">⚖️ WeightTrend FHE</span>
            <div className="footer-links">
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">Github</a>
              <a href="#" className="footer-link">Zama Protocol</a>
              <a href="#" className="footer-link">Privacy Policy</a>
            </div>
            <p className="footer-copyright">© 2025 WeightTrend FHE. Powered by Zama FHEVM.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
