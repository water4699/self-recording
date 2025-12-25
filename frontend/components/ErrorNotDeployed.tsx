import './WeightTrendDemo.css';

export function errorNotDeployed(chainId: number | undefined) {
  return (
    <div className="weight-trend-app">
      <div className="weight-trend-main">
        <div className="weight-trend-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 101, 101, 0.1) 100%)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <h2 className="card-title">❌ Contract Not Deployed</h2>
          <div className="error-message" style={{ marginTop: 0 }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.125rem' }}>
                WeightTrend.sol Contract Not Deployed on chainId={chainId} {chainId === 11155111 ? "(Sepolia)" : ""}
              </p>
              <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                It appears that the <span style={{ fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>WeightTrend.sol</span> contract
                has either not been deployed yet, or the deployment address is missing
                from the ABI directory <span style={{ fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>frontend/abi</span>.
              </p>
              <p style={{ marginBottom: '1rem', fontWeight: 600 }}>
                To deploy WeightTrend.sol on {chainId === 11155111 ? "Sepolia" : "your network"}, run:
              </p>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                fontFamily: 'monospace',
                fontSize: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '1rem'
              }}>
                <span style={{ opacity: 0.6, fontStyle: 'italic', color: '#fca5a5' }}>
                  # from root directory
                </span>
                <br />
                <span style={{ color: '#60a5fa' }}>npx hardhat deploy --network</span>{' '}
                <span style={{ color: '#34d399' }}>{chainId === 11155111 ? "sepolia" : "your-network-name"}</span>
              </div>
              <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
                Alternatively, switch to the local <span style={{ fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Hardhat Node</span> using the
                Rainbow wallet browser extension.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

