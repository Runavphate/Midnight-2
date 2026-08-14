# Midnight Privacy Counter dApp

> A privacy-preserving counter smart contract and React dApp on the Midnight network — increments a public on-chain counter only when the caller proves knowledge of a private secret, without ever revealing the secret on-chain.

---

## 🌐 Live Demo & Submission Links

| Resource | Link / Details |
| :--- | :--- |
| **Live Demo (Vercel / Netlify)** | [https://midnight-counter.vercel.app](https://midnight-2-livid.vercel.app/) |
| **GitHub Repository** | [https://github.com/Runavphate/Midnight-2](https://github.com/Runavphate/Midnight-2) |
| **Demo Video (Wallet Connect + Circuit Call)** | [Watch Demo Video](https://youtube.com) |

---

## 📜 Deployed Contract Address

| Network | Contract Address |
| :--- | :--- |
| **Midnight Preview** | `f2c2ebbd9c48a7928bf5674f785561d68bb2f86c577244dcb7e76295c53d2ac0` |
* **Verified On-Chain:** State queryable via Midnight Indexer / RPC node.

---

## 🛡️ Privacy Claim & Privacy Model

The core innovation of Midnight is **Kachina Zero-Knowledge Smart Contracts**, which separate private computations in local memory from public on-chain state.

### Privacy Breakdown:

| Dimension | Visibility | Description |
| :--- | :--- | :--- |
| **PUBLIC (On-Chain)** | 🌐 Public to Anyone | • The current total `counter` value on the ledger.<br>• The Boolean result returned by `disclose(secret == expected)`.<br>• Transaction execution metadata and gas fees (in `tDUST`). |
| **PRIVATE (Local Witness)** | 🔒 Off-Chain Only | • The caller's private `secret` witness (`Uint<64>`).<br>• Private memory variables and local witness calculation.<br>• Raw private inputs are **NEVER** transmitted on-chain or displayed in the UI. |
| **PROVED WITHOUT REVEALING** | ⚡ Zero-Knowledge SNARK | • Proves mathematically that the caller possesses a valid secret matching the circuit expectation.<br>• The verifier confirms validity with 100% cryptographic certainty while the raw secret remains zero-knowledge. |

---

## 🚀 What This Does

The **Midnight Counter** maintains a single public counter stored on-chain. Instead of allowing arbitrary public writes, the contract evaluates a Zero-Knowledge predicate:

```
Caller (Local Memory)               Midnight Network (Public Ledger)
───────────────────────              ────────────────────────────────
secret = 12345n (Private Witness)   
                                    expected = 12345n (Public Argument)
        ┌─────────────────────────┐
        │ Local ZK Proof Computed │ ──────► incrementIfValid(expected)
        │ "I know secret matching │                 │
        │  the expected value"    │                 ▼
        └─────────────────────────┘         disclose(secret == expected) → true
                                            counter += 1
                                            (Raw secret is NEVER broadcasted)
```

1. **Private Witness Query:** The circuit reads `secret()` from local memory.
2. **ZK Proof Generation:** A ZK-SNARK proof is synthesized locally in the browser/proof-server.
3. **State Transition:** The ledger verifies the proof and selectively increments `counter` only if `disclose(valid)` yields `true`.

---

## 💻 Tech Stack

* **Blockchain:** [Midnight Network](https://midnight.network/) (Preview / Preprod Testnet)
* **Smart Contract Language:** [Compact v0.18](https://docs.midnight.network/)
* **Frontend Framework:** React 18 + Vite 5 + TypeScript
* **Wallet Connectors:** Lace Wallet & 1AM Wallet (CIP-30 / Midnight Connector API)
* **Testing & Tooling:** Node.js v22, Vitest, Docker (ZK Proof Server)
* **Hosting:** Vercel & Netlify ready (`vercel.json`, `netlify.toml`)

---

## 📁 Project Structure

```
midnight/
├── contracts/
│   ├── counter.compact          # Compact ZK smart contract
│   └── managed/
│       └── counter/             # Auto-generated ABI & bytecode
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx    # Multi-wallet connector UI (Lace & 1AM)
│   │   └── CircuitCall.tsx      # ZK Circuit Execution HUD + receipt
│   ├── hooks/
│   │   └── useMidnight.ts       # Custom hook for DApp connector API
│   ├── App.tsx                  # Root layout with top-right wallet widget
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Cosmic Aurora design system
│   ├── deploy.ts                # Testnet deployment script
│   └── setup.ts                 # Wallet configuration helper
├── tests/
│   └── counter.test.ts          # Unit and privacy validation tests
├── vercel.json                  # Vercel deployment config
├── netlify.toml                 # Netlify deployment config
├── package.json
└── README.md
```

---

## 🛠️ How to Run Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Runavphate/Midnight-1
cd midnight
npm install --legacy-peer-deps
```

### 2. Start the Frontend Development Server
```bash
npm run dev
# → Open http://localhost:5173 in your browser
```

### 3. Compile the Smart Contract
```bash
npm run compile
```

### 4. Deploy Contract to Testnet
```bash
# Start local proof server (Docker required)
npm run proof-server:start

# Run wallet setup and deploy
npm run setup
npm run deploy
```

---

## 💡 Initial Product Idea

I wanted to explore how **zero-knowledge proofs** can enforce access control on a public blockchain without exposing sensitive credentials or private logic. Traditional blockchains are transparent by default: every argument and state update is visible to the entire world.

This project demonstrates the minimal viable implementation of **privacy-gated state transitions**. By combining **Compact private witnesses** with **Midnight's dual-token gas economy**, we prove that decentralized applications can maintain public auditability while guaranteeing absolute user privacy. This architecture serves as the foundation for private voting systems, compliance-gated DeFi, and confidential digital identity verification.

---

## 📸 Screenshots

### Screenshot 1 — Successful Contract Compilation
![Compile Output](./screenshots/compile.png)

### Screenshot 2 — Contract Deployed to Testnet
![Deploy Output](./screenshots/deploy.png)

---

## 📄 License

MIT
