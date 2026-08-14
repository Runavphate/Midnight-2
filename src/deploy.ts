/**
 * Deploy the Midnight counter contract.
 *
 * Usage:
 *   npm run deploy -- --network preview
 *   npm run deploy -- --network preprod
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

// Required for Midnight wallet sync.
// @ts-expect-error @types/ws is not structurally identical to lib.dom WebSocket.
globalThis.WebSocket = WebSocket;

import {
  resolveNetwork,
  getOrCreateSeed,
  recordDeployment,
} from './network';

import {
  createWallet,
  persistWalletState,
  unshieldedToken,
  type WalletContext,
} from './wallet';

import {
  deployContract,
} from '@midnight-ntwrk/midnight-js-contracts';

import {
  httpClientProofProvider,
} from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

import {
  indexerPublicDataProvider,
} from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

import {
  levelPrivateStateProvider,
} from '@midnight-ntwrk/midnight-js-level-private-state-provider';

import {
  NodeZkConfigProvider,
} from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

import {
  CompiledContract,
} from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import type * as CounterManaged
  from '../contracts/managed/counter/contract/index.js';

// -----------------------------------------------------------------------------
// Network
// -----------------------------------------------------------------------------

const { network, config: networkConfig } =
  resolveNetwork();

const SEED =
  getOrCreateSeed(network);

// -----------------------------------------------------------------------------
// Private state
// -----------------------------------------------------------------------------

type CounterPrivateState = {
  secret: bigint;
};

const PRIVATE_STATE_ID =
  'counterPrivateState';

// -----------------------------------------------------------------------------
// Compiled counter contract
// -----------------------------------------------------------------------------

const __dirname =
  path.dirname(
    fileURLToPath(import.meta.url),
  );

const zkConfigPath =
  path.resolve(
    __dirname,
    '..',
    'contracts',
    'managed',
    'counter',
  );

const contractPath =
  path.join(
    zkConfigPath,
    'contract',
    'index.js',
  );

if (!fs.existsSync(contractPath)) {
  console.error(
    '\n❌ Counter contract is not compiled.\n' +
      'Run:\n' +
      '  npm run compile\n',
  );

  process.exit(1);
}

const Counter =
  await import(
    pathToFileURL(contractPath).href,
  );

// -----------------------------------------------------------------------------
// Witness implementation
// -----------------------------------------------------------------------------

const counterWitnesses:
  CounterManaged.Witnesses<CounterPrivateState> =
  {
    secret: ({ privateState }) => [
      privateState,
      privateState.secret,
    ],
  };

// -----------------------------------------------------------------------------
// Compiled contract binding
// -----------------------------------------------------------------------------

const compiledCounterContract =
  CompiledContract.make<
    CounterManaged.Contract<CounterPrivateState>
  >(
    'counter',
    Counter.Contract,
  ).pipe(
    CompiledContract.withWitnesses(
      counterWitnesses,
    ),
    CompiledContract.withCompiledFileAssets(
      zkConfigPath,
    ),
  );

// -----------------------------------------------------------------------------
// Proof server readiness
// -----------------------------------------------------------------------------

async function waitForProofServer(
  maxAttempts = 60,
  delayMs = 2000,
): Promise<boolean> {
  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      await fetch(
        networkConfig.proofServer,
        {
          method: 'GET',
          signal:
            AbortSignal.timeout(3000),
        },
      );

      return true;
    } catch (err: any) {
      const code =
        err?.cause?.code ||
        err?.code ||
        '';

      if (
        code !== 'ECONNREFUSED' &&
        code !== 'UND_ERR_CONNECT_TIMEOUT' &&
        code !== 'UND_ERR_SOCKET'
      ) {
        return true;
      }
    }

    if (attempt < maxAttempts) {
      process.stdout.write(
        `\r  Waiting for proof server... (${attempt}/${maxAttempts})   `,
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            delayMs,
          ),
      );
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// Providers
// -----------------------------------------------------------------------------

async function createProviders(
  walletCtx: WalletContext,
) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() ||
    'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () =>
      walletCtx.shieldedSecretKeys.coinPublicKey,

    getEncryptionPublicKey: () =>
      walletCtx.shieldedSecretKeys.encryptionPublicKey,

    async balanceTx(
      tx: any,
      ttl?: Date,
    ) {
      const recipe =
        await walletCtx.wallet.balanceUnboundTransaction(
          tx,
          {
            shieldedSecretKeys:
              walletCtx.shieldedSecretKeys,
            dustSecretKey:
              walletCtx.dustSecretKey,
          },
          {
            ttl:
              ttl ??
              new Date(
                Date.now() +
                  30 * 60 * 1000,
              ),
          },
        );

      return walletCtx.wallet.finalizeRecipe(
        recipe,
      );
    },

    submitTx: (
      tx: any,
    ) =>
      walletCtx.wallet.submitTransaction(
        tx,
      ) as any,
  };

  const zkConfigProvider =
    new NodeZkConfigProvider(
      zkConfigPath,
    );

  const accountId =
    walletCtx.unshieldedKeystore
      .getBech32Address()
      .toString();

  return {
    privateStateProvider:
      levelPrivateStateProvider({
        privateStateStoreName:
          'counter-state',

        accountId,

        privateStoragePasswordProvider:
          () => privateStatePassword,
      }),

    publicDataProvider:
      indexerPublicDataProvider(
        networkConfig.indexer,
        networkConfig.indexerWS,
      ),

    zkConfigProvider,

    proofProvider:
      httpClientProofProvider(
        networkConfig.proofServer,
        zkConfigProvider,
      ),

    walletProvider,

    midnightProvider:
      walletProvider,
  };
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log(
    '\n╔══════════════════════════════════════════════════════════════╗',
  );

  console.log(
    `║  Deploy counter to ${network}`.padEnd(63) + '║',
  );

  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n',
  );

  // ---------------------------------------------------------------------------
  // Wallet
  // ---------------------------------------------------------------------------

  console.log(
    '─── Wallet setup ───────────────────────────────────────────────\n',
  );

  console.log(
    '  Creating wallet...',
  );

  const walletCtx =
    await createWallet({
      network,
      networkConfig,
      seed: SEED,
    });

  const restoredCount =
    Object.values(
      walletCtx.restored,
    ).filter(Boolean).length;

  if (restoredCount > 0) {
    console.log(
      `  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume from saved point.`,
    );
  }

  console.log(
    '  Syncing with network...',
  );

  console.log(
    '  ℹ  This may take several minutes depending on network size.',
  );

  console.log(
    '     RPC disconnection messages during sync are normal and can be safely ignored.\n',
  );

  const syncStart =
    Date.now();

  const syncInterval =
    setInterval(() => {
      const elapsed =
        Math.round(
          (Date.now() - syncStart) / 1000,
        );

      process.stdout.write(
        `\r  ⏳ Still syncing... (${elapsed}s elapsed)   `,
      );
    }, 5000);

  const state =
    await walletCtx.wallet.waitForSyncedState();

  clearInterval(syncInterval);

  process.stdout.write(
    '\r  ✓ Synced with network.                                      \n',
  );

  await persistWalletState(
    network,
    walletCtx,
  );

  const address =
    walletCtx.unshieldedKeystore
      .getBech32Address();

  const balance =
    state.unshielded.balances[
      unshieldedToken().raw
    ] ?? 0n;

  console.log(
    `\n  Wallet Address: ${address}`,
  );

  console.log(
    `  Balance: ${balance.toLocaleString()} tNIGHT\n`,
  );

  // ---------------------------------------------------------------------------
  // Local devnet
  // ---------------------------------------------------------------------------

  if (
    network === 'undeployed' &&
    balance === 0n
  ) {
    console.error(
      '\n❌ Genesis-seed wallet has zero NIGHT.\n',
    );

    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // Preview / Preprod faucet
  // ---------------------------------------------------------------------------

  if (
    network !== 'undeployed' &&
    networkConfig.faucet
  ) {
    const initialBalance =
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.filter(
            (s) => s.isSynced,
          ),
        ),
      );

    const initialTNight =
      initialBalance.unshielded.balances[
        unshieldedToken().raw
      ] ?? 0n;

    if (initialTNight === 0n) {
      console.log(
        '─── Fund Wallet ────────────────────────────────────────────────\n',
      );

      console.log(
        `  Wallet address: ${address}`,
      );

      console.log(
        `  Faucet:         ${networkConfig.faucet}`,
      );

      console.log(
        '\n  Waiting for tNIGHT to arrive (poll every 10s)...',
      );

      const rawTimeout =
        Number(
          process.env.MIDNIGHT_FAUCET_TIMEOUT_MS,
        );

      const timeoutMs =
        Number.isFinite(rawTimeout) &&
        rawTimeout > 0
          ? rawTimeout
          : 600_000;

      const start =
        Date.now();

      while (true) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              10_000,
            ),
        );

        const currentState =
          await Rx.firstValueFrom(
            walletCtx.wallet.state().pipe(
              Rx.filter(
                (s) => s.isSynced,
              ),
            ),
          );

        const tn =
          currentState.unshielded.balances[
            unshieldedToken().raw
          ] ?? 0n;

        if (tn > 0n) {
          console.log(
            `\n  Funded! tNIGHT balance: ${tn.toLocaleString()}\n`,
          );

          break;
        }

        if (
          Date.now() - start >
          timeoutMs
        ) {
          console.log(
            `\n  ❌ Funding not received within ${Math.round(
              timeoutMs / 60_000,
            )} min.`,
          );

          console.log(
            `  Address: ${address}`,
          );

          console.log(
            `  Faucet:  ${networkConfig.faucet}`,
          );

          await walletCtx.wallet.stop();
          process.exit(1);
        }

        const elapsed =
          Math.round(
            (Date.now() - start) / 1000,
          );

        process.stdout.write(
          `\r  ...still waiting (${elapsed}s)`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DUST
  // ---------------------------------------------------------------------------

  console.log(
    '─── DUST Token Setup ───────────────────────────────────────────\n',
  );

  const dustState =
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.filter(
          (s) => s.isSynced,
        ),
      ),
    );

  const unregisteredUtxos =
    dustState.unshielded.availableCoins.filter(
      (c: any) =>
        !c.meta?.registeredForDustGeneration,
    );

  if (unregisteredUtxos.length > 0) {
    console.log(
      `  Registering ${unregisteredUtxos.length} NIGHT UTXOs for DUST generation...`,
    );

    const recipe =
      await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregisteredUtxos,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload) =>
          walletCtx.unshieldedKeystore.signData(
            payload,
          ),
      );

    const finalized =
      await walletCtx.wallet.finalizeRecipe(
        recipe,
      );

    await walletCtx.wallet.submitTransaction(
      finalized,
    );
  }

  if (
    dustState.dust.balance(new Date()) === 0n
  ) {
    console.log(
      '  Waiting for DUST tokens...',
    );

    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter(
          (s) => s.isSynced,
        ),
        Rx.filter(
          (s) =>
            s.dust.balance(new Date()) > 0n,
        ),
      ),
    );
  }

  console.log(
    '  DUST tokens ready!\n',
  );

  // ---------------------------------------------------------------------------
  // Proof server
  // ---------------------------------------------------------------------------

  console.log(
    '─── Deploy Counter Contract ───────────────────────────────────\n',
  );

  console.log(
    '  Checking proof server...',
  );

  const proofServerReady =
    await waitForProofServer();

  if (!proofServerReady) {
    console.log(
      '\n  ❌ Proof server not responding.\n',
    );

    await walletCtx.wallet.stop();
    process.exit(1);
  }

  process.stdout.write(
    '\r  Proof server ready!                                 \n',
  );

  console.log(
    '  Setting up providers...',
  );

  const providers =
    await createProviders(
      walletCtx,
    );

  // ---------------------------------------------------------------------------
  // DUST timing
  // ---------------------------------------------------------------------------

  process.stdout.write(
    '  Generating DUST...',
  );

  await new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        6000,
      ),
  );

  process.stdout.write(
    ' done.\n',
  );

  // ---------------------------------------------------------------------------
  // Deploy
  // ---------------------------------------------------------------------------

  console.log(
    '  Deploying counter contract...\n',
  );

  const MAX_RETRIES = 20;
  const RETRY_DELAY_MS = 5000;

  let deployed:
    Awaited<
      ReturnType<
        typeof deployContract
      >
    > | undefined;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      deployed =
        await deployContract(
          providers,
          {
            compiledContract:
              compiledCounterContract as any,

            args: [],

            privateStateId:
              PRIVATE_STATE_ID,

            initialPrivateState: {
              secret: 12345n,
            },
          },
        );

      break;
    } catch (err: any) {
      const errMsg =
        err?.message ||
        err?.toString() ||
        '';

      const errCause =
        err?.cause?.message ||
        err?.cause?.toString() ||
        '';

      const fullError =
        `${errMsg} ${errCause}`;

      console.error(
        `\n  Attempt ${attempt} error: ${errMsg}`,
      );

      if (
        errCause &&
        errCause !== errMsg
      ) {
        console.error(
          `  Cause: ${errCause}`,
        );
      }

      const isDustShortage =
        fullError.includes(
          'Not enough Dust',
        ) ||
        fullError.includes(
          'Insufficient Funds',
        ) ||
        fullError.includes(
          'could not balance dust',
        );

      const isProofServerError =
        fullError.includes(
          'Failed to connect to Proof Server',
        ) ||
        fullError.includes(
          'connect ECONNREFUSED 127.0.0.1:6300',
        );

      if (
        isProofServerError &&
        !isDustShortage
      ) {
        console.log(
          '\n  ❌ Proof server unreachable.',
        );

        await walletCtx.wallet.stop();
        process.exit(1);
      }

      if (isDustShortage) {
        const currentState =
          await walletCtx.wallet.waitForSyncedState();

        const dustBalance =
          currentState.dust.balance(
            new Date(),
          );

        if (attempt < MAX_RETRIES) {
          console.log(
            `  ⏳ DUST balance: ${dustBalance.toLocaleString()} (attempt ${attempt}/${MAX_RETRIES}); retrying in ${RETRY_DELAY_MS / 1000}s...`,
          );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                RETRY_DELAY_MS,
              ),
          );
        } else {
          console.log(
            `\n  ❌ Not enough DUST after ${MAX_RETRIES} retries.`,
          );

          await walletCtx.wallet.stop();
          process.exit(1);
        }
      } else {
        throw err;
      }
    }
  }

  if (!deployed) {
    throw new Error(
      'Deployment failed after all retries',
    );
  }

  // ---------------------------------------------------------------------------
  // Print deployed address
  // ---------------------------------------------------------------------------

  const contractAddress =
    deployed.deployTxData.public.contractAddress;

  console.log(
    '\n╔══════════════════════════════════════════════════════════════╗',
  );

  console.log(
    '║              COUNTER CONTRACT DEPLOYED                     ║',
  );

  console.log(
    '╠══════════════════════════════════════════════════════════════╣',
  );

  console.log(
    `║ Contract Address: ${contractAddress}`,
  );

  console.log(
    `║ Network:          ${network}`,
  );

  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n',
  );

  recordDeployment(
    network,
    contractAddress,
    address.toString(),
  );

  console.log(
    '  Saved to .midnight-state.json\n',
  );

  await persistWalletState(
    network,
    walletCtx,
  );

  await walletCtx.wallet.stop();

  console.log(
    '─── Deployment complete ────────────────────────────────────────\n',
  );
}

main().catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
);