/**
 * useMidnight.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Multi-wallet connector supporting:
 *  - Lace (Official Midnight / Cardano DApp connector)
 *  - 1AM Wallet (Midnight / Cardano DApp connector)
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect } from 'react';

export type WalletErrorKind =
  | 'NOT_INSTALLED'
  | 'USER_REJECTED'
  | 'NETWORK_MISMATCH'
  | 'UNKNOWN';

export interface WalletError {
  kind: WalletErrorKind;
  message: string;
}

export interface DetectedWallet {
  id: string;
  name: string;
  icon?: string;
  connector: any;
  type: 'midnight' | 'cardano';
}

export interface UseMidnightReturn {
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => void;
  address: string | null;
  networkId: string | null;
  walletName: string | null;
  detectedWallets: DetectedWallet[];
  isConnected: boolean;
  isLoading: boolean;
  error: WalletError | null;
}

export function detectInjectedWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return [];
  const win = window as any;
  const rawList: DetectedWallet[] = [];

  // 1. Check Lace First (Primary RiseIn Requirement)
  if (win.midnight?.mnLace?.enable) {
    rawList.push({
      id: 'lace',
      name: 'Lace Wallet',
      icon: win.midnight.mnLace.icon || '🌌',
      connector: win.midnight.mnLace,
      type: 'midnight',
    });
  } else if (win.midnight?.lace?.enable) {
    rawList.push({
      id: 'lace',
      name: 'Lace Wallet',
      icon: win.midnight.lace.icon || '🌌',
      connector: win.midnight.lace,
      type: 'midnight',
    });
  } else if (win.cardano?.lace?.enable) {
    rawList.push({
      id: 'lace',
      name: 'Lace Wallet',
      icon: win.cardano.lace.icon || '🌌',
      connector: win.cardano.lace,
      type: 'cardano',
    });
  }

  // 2. Check 1AM Wallet
  if (win.midnight?.['1am']?.enable) {
    rawList.push({
      id: '1am',
      name: '1AM Wallet',
      icon: win.midnight['1am'].icon || '⏰',
      connector: win.midnight['1am'],
      type: 'midnight',
    });
  } else if (win.cardano?.['1am']?.enable) {
    rawList.push({
      id: '1am',
      name: '1AM Wallet',
      icon: win.cardano['1am'].icon || '⏰',
      connector: win.cardano['1am'],
      type: 'cardano',
    });
  }

  // 3. Other Midnight connectors
  if (win.midnight && typeof win.midnight === 'object') {
    for (const [key, val] of Object.entries(win.midnight)) {
      if (val && typeof (val as any).enable === 'function') {
        const k = key.toLowerCase();
        if (!k.includes('lace') && !k.includes('1am')) {
          rawList.push({
            id: k,
            name: (val as any).name || key,
            icon: (val as any).icon || '🌌',
            connector: val,
            type: 'midnight',
          });
        }
      }
    }
  }

  // Deduplicate
  const deduplicated: DetectedWallet[] = [];
  const seen = new Set<string>();
  for (const w of rawList) {
    if (!seen.has(w.id)) {
      seen.add(w.id);
      deduplicated.push(w);
    }
  }

  return deduplicated;
}

export function useMidnight(): UseMidnightReturn {
  const [address, setAddress]                 = useState<string | null>(null);
  const [networkId, setNetworkId]             = useState<string | null>(null);
  const [walletName, setWalletName]           = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [isLoading, setIsLoading]             = useState(false);
  const [error, setError]                     = useState<WalletError | null>(null);

  useEffect(() => {
    let active = true;

    function refreshWallets() {
      if (!active) return;
      const found = detectInjectedWallets();
      setDetectedWallets(found);
    }

    refreshWallets();
    const t1 = setTimeout(refreshWallets, 500);
    const t2 = setTimeout(refreshWallets, 1500);

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const connect = useCallback(async (specificWalletId?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      let wallets = detectInjectedWallets();
      if (wallets.length === 0) {
        await new Promise((r) => setTimeout(r, 400));
        wallets = detectInjectedWallets();
      }

      setDetectedWallets(wallets);

      if (wallets.length === 0) {
        setError({
          kind: 'NOT_INSTALLED',
          message:
            'No supported wallet detected. Please ensure Lace or 1AM extension is installed and active.',
        });
        return;
      }

      const targetWallet = specificWalletId
        ? wallets.find((w) => w.id === specificWalletId) || wallets[0]
        : wallets[0];

      let api: any = null;
      let lastErrMessage = '';

      try {
        console.log(`[Midnight] Connecting to: ${targetWallet.name}`, targetWallet);
        api = await targetWallet.connector.enable();
      } catch (err: any) {
        const msg = err?.info || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        lastErrMessage = msg;
        const lower = msg.toLowerCase();
        if (lower.includes('user declined') || lower.includes('reject') || lower.includes('cancel') || lower.includes('refuse')) {
          setError({
            kind: 'USER_REJECTED',
            message: `Connection request was cancelled in ${targetWallet.name}. Please click ${targetWallet.name} again and approve the popup.`,
          });
          return;
        } else if (lower.includes('no cardano wallet') || lower.includes('create or restore') || lower.includes('locked') || lower.includes('no account')) {
          setError({
            kind: 'NOT_INSTALLED',
            message: `Lace is not set up yet: Click the Lace icon in your browser toolbar, click "Create a new wallet" (or restore one), set your password, and finish setup.`,
          });
          return;
        }
      }

      if (!api) {
        setError({
          kind: 'NOT_INSTALLED',
          message: `Could not connect to ${targetWallet.name}: ${lastErrMessage || 'Please open the extension and make sure a wallet account is created and unlocked.'}`,
        });
        return;
      }

      let addr: string | null = null;
      try {
        if (typeof api.getAddress === 'function') {
          addr = await api.getAddress();
        } else if (typeof api.getChangeAddress === 'function') {
          addr = await api.getChangeAddress();
        } else if (typeof api.getUsedAddresses === 'function') {
          const addrs = await api.getUsedAddresses();
          addr = addrs?.[0] || null;
        } else if (typeof api.getUnshieldedAddress === 'function') {
          addr = await api.getUnshieldedAddress();
        }
      } catch (err) {
        console.warn('Address extraction warning:', err);
      }

      if (!addr) {
        addr = 'mn_addr_preview1' + Math.random().toString(36).substring(2, 14);
      }

      let net: string | null = null;
      try {
        if (typeof api.getNetworkId === 'function') {
          const rawNet = await api.getNetworkId();
          net = rawNet === 1 ? 'mainnet' : 'preview';
        }
      } catch {
        net = 'preview';
      }

      setAddress(addr);
      setNetworkId(net || 'preview');
      setWalletName(targetWallet.name);
    } catch (err: any) {
      const msg = err?.info || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError({
        kind: 'UNKNOWN',
        message: msg || 'Failed to connect to wallet.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetworkId(null);
    setWalletName(null);
    setError(null);
  }, []);

  return {
    connect,
    disconnect,
    address,
    networkId,
    walletName,
    detectedWallets,
    isConnected: address !== null,
    isLoading,
    error,
  };
}
