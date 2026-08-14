import React, { useState } from 'react';
import { UseMidnightReturn } from '../hooks/useMidnight';

interface WalletConnectProps extends UseMidnightReturn {}

function shortAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function WalletConnect({
  connect,
  disconnect,
  address,
  networkId,
  walletName,
  detectedWallets,
  isConnected,
  isLoading,
  error,
}: WalletConnectProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied]       = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWalletSelect = (walletId: string) => {
    setShowModal(false);
    connect(walletId);
  };

  return (
    <div style={styles.wrapper}>
      {/* ── Top Right Connected / Disconnected Pill Button ── */}
      {isConnected && address ? (
        <div style={styles.connectedPillGroup}>
          <div style={styles.addressPill} onClick={handleCopy} title="Click to copy address">
            <span style={styles.liveGreenDot} />
            <span style={styles.walletNameSmall}>{walletName || 'Wallet'}</span>
            <code style={styles.addressText}>{shortAddress(address)}</code>
            <span style={styles.copyHint}>{copied ? '✓' : '📋'}</span>
          </div>

          <button
            style={styles.disconnectIconBtn}
            onClick={disconnect}
            title="Disconnect wallet"
            id="btn-disconnect-wallet"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          style={styles.connectTopBtn}
          onClick={() => {
            if (detectedWallets.length === 1) {
              connect(detectedWallets[0].id);
            } else {
              setShowModal(true);
            }
          }}
          disabled={isLoading}
          id="btn-connect-wallet"
        >
          <span style={styles.topBtnIcon}>🌌</span>
          <span>{isLoading ? 'Connecting…' : 'Connect Wallet'}</span>
        </button>
      )}

      {/* ── Wallet Selection Modal ── */}
      {showModal && !isConnected && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleGroup}>
                <span style={{ fontSize: '20px' }}>🔐</span>
                <h3 style={styles.modalTitle}>Connect a Wallet</h3>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <p style={styles.modalSub}>
              Select an installed wallet to connect to <strong>Midnight Preview</strong>:
            </p>

            <div style={styles.walletList}>
              {detectedWallets.length > 0 ? (
                detectedWallets.map((w) => (
                  <button
                    key={w.id}
                    style={styles.walletChoiceBtn}
                    onClick={() => handleWalletSelect(w.id)}
                    id={`btn-connect-${w.id}`}
                  >
                    <div style={styles.walletChoiceIcon}>
                      {w.icon && (w.icon.startsWith('data:image') || w.icon.startsWith('http')) ? (
                        <img
                          src={w.icon}
                          alt={w.name}
                          style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4 }}
                        />
                      ) : (
                        <span style={{ fontSize: '22px' }}>{w.icon || '🌌'}</span>
                      )}
                    </div>
                    <div style={styles.walletChoiceInfo}>
                      <span style={styles.walletChoiceName}>{w.name}</span>
                      <span style={styles.walletChoiceTag}>{w.type.toUpperCase()}</span>
                    </div>
                    <span style={styles.walletArrow}>→</span>
                  </button>
                ))
              ) : (
                <button
                  style={styles.walletChoiceBtn}
                  onClick={() => {
                    setShowModal(false);
                    connect();
                  }}
                  id="btn-connect-autodetect"
                >
                  <span style={{ fontSize: '22px' }}>⚡</span>
                  <div style={styles.walletChoiceInfo}>
                    <span style={styles.walletChoiceName}>Auto-Detect (Lace / 1AM)</span>
                    <span style={styles.walletChoiceTag}>BROWSER EXTENSIONS</span>
                  </div>
                  <span style={styles.walletArrow}>→</span>
                </button>
              )}
            </div>

            {error && (
              <div style={styles.modalError}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span style={styles.modalErrorText}>{error.message}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  connectTopBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-sans)',
  },
  topBtnIcon: {
    fontSize: '16px',
  },
  connectedPillGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 20, 42, 0.8)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '12px',
    padding: '4px 6px 4px 12px',
  },
  addressPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  liveGreenDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--emerald)',
    boxShadow: '0 0 8px var(--emerald)',
  },
  walletNameSmall: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  addressText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  copyHint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  disconnectIconBtn: {
    background: 'rgba(244, 63, 94, 0.15)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#fda4af',
    borderRadius: '8px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(4, 6, 15, 0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(16, 20, 42, 0.95)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), var(--shadow-glow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  modalTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
  },
  modalSub: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
  },
  walletList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  walletChoiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    color: '#f8fafc',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  walletChoiceIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletChoiceInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '2px',
  },
  walletChoiceName: {
    fontSize: '14.5px',
    fontWeight: 700,
  },
  walletChoiceTag: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    letterSpacing: '0.04em',
  },
  walletArrow: {
    color: 'var(--accent-primary)',
    fontSize: '16px',
    fontWeight: 700,
  },
  modalError: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
  },
  modalErrorText: {
    fontSize: '12px',
    color: '#fda4af',
  },
};
