import React from 'react';
import { useMidnight } from './hooks/useMidnight';
import WalletConnect from './components/WalletConnect';
import CircuitCall from './components/CircuitCall';

export default function App() {
  const wallet = useMidnight();

  return (
    <div style={styles.appWrapper}>
      {/* ── Top Navigation Bar ── */}
      <header style={styles.navbar}>
        <div style={styles.navContainer}>
          {/* Logo & Project Name on the left */}
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>
              <span style={styles.logoGlyph}>🌑</span>
            </div>
            <div style={styles.brandTextGroup}>
              <span style={styles.brandTitle}>Midnight</span>
              <span style={styles.brandSubtitle}>ZK Counter dApp</span>
            </div>
          </div>

          {/* Network pill & Connect Wallet button on the right */}
          <div style={styles.navRight}>
            <div style={styles.networkIndicator}>
              <span style={styles.liveDot} />
              <span style={styles.networkLabel}>Preview</span>
            </div>
            <WalletConnect {...wallet} />
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div style={styles.contentContainer}>
        {/* ── Hero Section ── */}
        <section style={styles.heroSection}>
          <div style={styles.heroPill}>
            <span style={styles.pillSparkle}>✨</span>
            <span>Zero-Knowledge Proofs on Midnight Network</span>
          </div>

          <h1 style={styles.heroHeading}>
            Privacy-Preserving<br />
            <span style={styles.gradientHeading}>Smart Contract Counter</span>
          </h1>

          <p style={styles.heroParagraph}>
            Increment an on-chain counter by proving knowledge of a private witness without exposing your secret value to the public ledger.
          </p>
        </section>

        {/* ── Centered Circuit Engine Dashboard ── */}
        <main style={styles.mainDashboard}>
          <CircuitCall isConnected={wallet.isConnected} />
        </main>

        {/* ── Architecture Explorer / Interactive Explain Card ── */}
        <section style={styles.explainCard}>
          <div style={styles.explainHeader}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <h3 style={styles.explainTitle}>How This Privacy Model Works</h3>
          </div>

          <div style={styles.explainGrid}>
            <div style={styles.explainCol}>
              <div style={styles.explainColHeader}>
                <span style={styles.badgePublic}>PUBLIC ON-CHAIN</span>
              </div>
              <ul style={styles.explainList}>
                <li>The current <code>counter</code> total value</li>
                <li>Boolean result of circuit comparison (<code>true/false</code>)</li>
                <li>Transaction execution fees (<code>tDUST</code>)</li>
              </ul>
            </div>

            <div style={styles.explainCol}>
              <div style={styles.explainColHeader}>
                <span style={styles.badgePrivate}>PRIVATE IN LOCAL MEMORY</span>
              </div>
              <ul style={styles.explainList}>
                <li>The caller's <code>secret()</code> witness (never leaves browser)</li>
                <li>Local ZK proof generator parameters</li>
                <li>Caller identity & private constraints</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>
            Built with <strong>Compact</strong> & <strong>Midnight.js SDK</strong> · Deployed to Midnight Preview
          </p>
          <div style={styles.contractAddressTag}>
            <span>Contract: </span>
            <code>f2c2ebbd9c48a7928bf5674f785561d68bb2f86c577244dcb7e76295c53d2ac0</code>
          </div>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  navbar: {
    width: '100%',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(7, 8, 16, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContainer: {
    maxWidth: '920px',
    margin: '0 auto',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
  },
  logoGlyph: {
    fontSize: '18px',
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  networkIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '6px 12px',
    borderRadius: '999px',
  },
  liveDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  networkLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#34d399',
  },
  contentContainer: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '36px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    width: '100%',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '14px',
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#c7d2fe',
    padding: '5px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
  },
  pillSparkle: {
    fontSize: '13px',
  },
  heroHeading: {
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    color: '#f8fafc',
    margin: 0,
  },
  gradientHeading: {
    background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #38bdf8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroParagraph: {
    fontSize: '15px',
    color: '#94a3b8',
    maxWidth: '560px',
    lineHeight: 1.6,
    margin: 0,
  },
  mainDashboard: {
    width: '100%',
  },
  explainCard: {
    background: 'rgba(14, 18, 38, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '24px 26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  explainHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  explainTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  explainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  explainCol: {
    background: 'rgba(8, 10, 24, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '14px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  explainColHeader: {
    marginBottom: '2px',
  },
  badgePublic: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.12)',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  badgePrivate: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#a855f7',
    background: 'rgba(168, 85, 247, 0.12)',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.05em',
  },
  explainList: {
    paddingLeft: '18px',
    fontSize: '12.5px',
    color: '#94a3b8',
    lineHeight: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: 0,
  },
  contractAddressTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11.5px',
    color: '#94a3b8',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
};
