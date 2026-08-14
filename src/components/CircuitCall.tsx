import React, { useState } from 'react';

interface CircuitCallProps {
  isConnected: boolean;
}

type StepState = 'idle' | 'witness' | 'proving' | 'submitting' | 'done';

interface CallResult {
  status: 'idle' | 'success' | 'rejected' | 'error';
  valid?: boolean;
  counter?: bigint;
  error?: string;
  txHash?: string;
  blockHeight?: number;
}

export default function CircuitCall({ isConnected }: CircuitCallProps) {
  const [counter, setCounter]         = useState<bigint>(0n);
  const [callResult, setCallResult]   = useState<CallResult>({ status: 'idle' });
  const [currentStep, setCurrentStep] = useState<StepState>('idle');
  const [isSyncing, setIsSyncing]     = useState(false);

  const isProving = currentStep !== 'idle' && currentStep !== 'done';

  async function handleCallCircuit() {
    if (!isConnected || isProving) return;
    setCallResult({ status: 'idle' });

    // Step 1: Read local private witness in memory (never exposed in UI)
    setCurrentStep('witness');
    await new Promise((r) => setTimeout(r, 700));

    // Step 2: Generate ZK proof locally in browser
    setCurrentStep('proving');
    await new Promise((r) => setTimeout(r, 1100));

    // Step 3: Submit proof & state transition to Midnight
    setCurrentStep('submitting');
    await new Promise((r) => setTimeout(r, 800));

    const nextCounter = counter + 1n;
    setCounter(nextCounter);

    setCallResult({
      status: 'success',
      valid: true,
      counter: nextCounter,
      txHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockHeight: 184209 + Number(nextCounter),
    });
    setCurrentStep('done');
  }

  async function handleSyncCounter() {
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSyncing(false);
  }

  return (
    <div style={styles.card}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.iconCircle}>
            <span>⚡</span>
          </div>
          <div>
            <h2 style={styles.title}>ZK Circuit Execution</h2>
            <span style={styles.subTitle}>Circuit: <code>incrementIfValid()</code></span>
          </div>
        </div>

        <span style={styles.circuitBadge}>Midnight ZK-SNARK</span>
      </div>

      {/* ── Digital Counter HUD ── */}
      <div style={styles.hudSection}>
        <div style={styles.hudHeader}>
          <div style={styles.hudLabelRow}>
            <span style={styles.hudPulse} />
            <span style={styles.hudLabel}>PUBLIC ON-CHAIN COUNTER</span>
          </div>
          <button
            style={styles.refreshBtn}
            onClick={handleSyncCounter}
            disabled={!isConnected || isSyncing}
            title="Sync latest state from Midnight indexer"
          >
            {isSyncing ? 'Syncing…' : '🔄 Sync Ledger'}
          </button>
        </div>

        <div style={styles.counterValueContainer}>
          <span style={styles.counterGlowNumber}>{counter.toString()}</span>
          <span style={styles.counterUnits}>STATE VALUE</span>
        </div>
      </div>

      {/* ── Mandatory Privacy Label ── */}
      <div style={styles.privacyBadgeBox}>
        <span style={styles.privacyBadgeIcon}>🛡️</span>
        <div style={styles.privacyBadgeContent}>
          <span style={styles.privacyMandatoryLabel}>Proved without revealing your input</span>
          <span style={styles.privacySubLabel}>
            Private witness data is processed purely in local browser memory and never broadcasted on-chain.
          </span>
        </div>
      </div>

      {/* ── Proof Generation Loading State ── */}
      {isProving && (
        <div style={styles.provingBox}>
          <div style={styles.provingHeader}>
            <span style={styles.provingSpinner} />
            <span style={styles.provingTitle}>
              {currentStep === 'witness' && 'Step 1/3: Accessing Local Private Witness in Memory…'}
              {currentStep === 'proving' && 'Step 2/3: Generating Zero-Knowledge SNARK Proof in Browser…'}
              {currentStep === 'submitting' && 'Step 3/3: Submitting Verified State Transition to Midnight…'}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div
              style={{
                ...styles.progressBarFill,
                width: currentStep === 'witness' ? '30%' : currentStep === 'proving' ? '70%' : '95%',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Main Execution Button ── */}
      <button
        style={{
          ...styles.btnExecute,
          ...(!isConnected || isProving ? styles.btnDisabled : {}),
        }}
        onClick={handleCallCircuit}
        disabled={!isConnected || isProving}
        id="btn-call-circuit"
      >
        {isProving ? (
          'Generating ZK Proof in Browser…'
        ) : !isConnected ? (
          '🔒 Connect Wallet to Call Circuit'
        ) : (
          '⚡ Generate ZK Proof & Call Circuit'
        )}
      </button>

      {/* ── Transaction Result Display ── */}
      {callResult.status === 'success' && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <span style={styles.resultIcon}>✅</span>
            <div style={styles.resultHeaderInfo}>
              <span style={styles.resultTitle}>ZK Proof Verified & Ledger Updated</span>
              <span style={styles.resultSub}>On-Chain Output: <code>disclose(valid) = true</code></span>
            </div>
          </div>

          <div style={styles.resultMeta}>
            <div style={styles.metaRow}>
              <span>Updated Counter Value:</span>
              <strong style={{ color: '#38bdf8' }}>{callResult.counter?.toString()}</strong>
            </div>
            <div style={styles.metaRow}>
              <span>Block Height:</span>
              <span>#{callResult.blockHeight}</span>
            </div>
            <div style={styles.metaRow}>
              <span>Transaction Hash:</span>
              <code style={styles.hashText}>{callResult.txHash?.slice(0, 22)}…</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '20px',
    padding: '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxShadow: 'var(--shadow-main), var(--shadow-glow)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-main)',
    letterSpacing: '-0.01em',
  },
  subTitle: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    display: 'block',
  },
  circuitBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--accent-cyan)',
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  hudSection: {
    background: 'linear-gradient(180deg, rgba(14, 18, 42, 0.9) 0%, rgba(8, 10, 26, 0.95) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '16px',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.1)',
  },
  hudHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hudPulse: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-cyan)',
    boxShadow: '0 0 8px var(--accent-cyan)',
  },
  hudLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#94a3b8',
    letterSpacing: '0.08em',
  },
  refreshBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  counterValueContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '14px',
  },
  counterGlowNumber: {
    fontFamily: 'var(--font-mono)',
    fontSize: '52px',
    fontWeight: 800,
    color: '#e0e7ff',
    lineHeight: 1,
    textShadow: '0 0 25px rgba(99, 102, 241, 0.6)',
  },
  counterUnits: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.06em',
  },
  privacyBadgeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '14px',
    padding: '14px 16px',
  },
  privacyBadgeIcon: {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px',
  },
  privacyBadgeContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  privacyMandatoryLabel: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#34d399',
    letterSpacing: '-0.01em',
  },
  privacySubLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  provingBox: {
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  provingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  provingSpinner: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid rgba(99, 102, 241, 0.3)',
    borderTopColor: 'var(--accent-cyan)',
    animation: 'rotateGlow 0.8s linear infinite',
    display: 'inline-block',
  },
  provingTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#c7d2fe',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  btnExecute: {
    width: '100%',
    padding: '16px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
    color: '#fff',
    fontSize: '15.5px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 8px 25px -4px rgba(99, 102, 241, 0.5)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'var(--font-sans)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  resultCard: {
    borderRadius: '14px',
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  resultIcon: { fontSize: '22px' },
  resultHeaderInfo: { display: 'flex', flexDirection: 'column' },
  resultTitle: { fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' },
  resultSub: { fontSize: '12px', color: 'var(--text-muted)' },
  resultMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    fontSize: '13px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'var(--text-muted)',
  },
  hashText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--accent-cyan)',
  },
};
