
# Arc + USDC AI Autopayments Demo

An end‑to‑end prototype for the **USDC x Arc Hackathon** that shows AI‑driven, rule‑based payments on **Arc Testnet** (EVM L1 with **USDC as native gas**).

**What it includes**

- **Solidity smart contract** (`Autopay.sol`) using native USDC (the chain gas) for subscriptions/conditional payouts.
- **Foundry scripts** to deploy to Arc Testnet.
- **Node.js AI Agent** (`agent/`) that evaluates natural‑language rules and executes on‑chain payments via the contract.
- **Tiny Web UI** (`web/`) to create/view subscriptions from a wallet on Arc Testnet.

> Arc Testnet references (chain id & RPC) are set from docs. Update RPC if needed.

## High‑level flow

1. User connects wallet on Arc Testnet and creates a subscription (payee, amount, cadence, optional rule text).
2. The **AI Agent** interprets the rule (simple LLM‑free rules engine demo provided) and when conditions match,
3. It calls the contract to settle the next period, sending native USDC (the chain currency) to the payee.
4. Everything runs on **testnet** – no real funds.

---

## Prereqs

- Node.js ≥ 18, Foundry (`foundryup`), and a wallet on **Arc Testnet**.
- **Testnet USDC** (native) in your wallet for gas and transfers:
  - Arc Testnet chain id: **5042002**
  - Example RPC endpoints: `https://rpc.testnet.arc.network` (see docs)
  - Explorer: `https://testnet.arcscan.app`
- You can also use third‑party endpoints (QuickNode, dRPC, Blockdaemon).

## Quick start

### 1) Install deps

```bash
pnpm i || npm i
```

### 2) Configure env

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

- `PRIVATE_KEY` — your testnet wallet private key (use a burner!)
- `ARC_RPC_URL` — e.g. `https://rpc.testnet.arc.network`

### 3) Build & test the contract

```bash
foundryup
forge build
forge test -vv
```

### 4) Deploy to Arc Testnet

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $ARC_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

This outputs the deployed **Autopay** address and also writes `deployments/arc-testnet.json` for the web & agent.

### 5) Run the AI Agent (demo logic)

```bash
npm run agent
```

It reads rules from `rules/sample.rules.json` and checks which subscriptions are due. If a rule evaluates to `true` and the payer is funded, it settles the period on‑chain.

### 6) Open the Web UI

```bash
npm run web
# then open http://localhost:5173
```

Connect your wallet (Metamask), ensure **Arc Testnet (chain 5042002)**, and create/test subscriptions.

---

## Project structure

```
contracts/Autopay.sol          # core contract
script/Deploy.s.sol            # Foundry deploy
test/Autopay.t.sol             # unit test (basic)
agent/index.ts                 # AI rules engine + onchain executor
web/index.html                 # minimal UI (no bundler)
web/app.js                     # ethers v6 + ABI; reads deployments/arc-testnet.json
deployments/arc-testnet.json   # auto‑generated on deploy
```

## Notes

- The contract uses `native` currency for payments; on Arc Testnet, native is **USDC**.
- For simplicity, "AI" is a deterministic rules engine parsing a small DSL (e.g., `"every 1 day if metric('views') > 1000"`). You can swap in any LLM or external signal; just implement `evaluateRule()`.
- Use **burner keys** only. This is testnet software.

## Security & production

This is a hackathon demo. If you intend to go further:
- Add reentrancy guards and full event indexing.
- Add per‑payer spending limits & allow‑lists.
- Consider account abstraction + session keys.
- Expand oracle coverage and robust rule evaluation.
- Formalize upgradeability & pause/kill switches.

---

## Arc Testnet details

- Chain ID: **5042002**
- Currency symbol: **USDC** (6 decimals)
- RPC: `https://rpc.testnet.arc.network` (see docs for alternatives)
- Explorer: `https://testnet.arcscan.app`

