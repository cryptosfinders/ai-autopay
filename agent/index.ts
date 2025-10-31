
import 'dotenv/config'
import { createPublicClient, createWalletClient, http, parseEther, getContract, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import dayjs from 'dayjs'
import fs from 'node:fs'

// ---- config ----
const RPC = process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`
if (!PRIVATE_KEY) {
  console.error('Set PRIVATE_KEY in .env (burner key!)')
  process.exit(1)
}

// load deployment
const deploymentPath = './deployments/arc-testnet.json'
if (!fs.existsSync(deploymentPath)) {
  console.error('Missing deployments/arc-testnet.json. Deploy first, then create this file.')
  console.error('Example: { "Autopay": "0x..." }')
  process.exit(1)
}
const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
const AUTOPAY = deployment.Autopay as `0x${string}`
if (!AUTOPAY) {
  console.error('deployments/arc-testnet.json must include { "Autopay": "0x..." }')
  process.exit(1)
}

// ABI (minimal)
const ABI = [
  { "type":"function","name":"createPlan","stateMutability":"nonpayable","inputs":[{"name":"payee","type":"address"},{"name":"amount","type":"uint256"},{"name":"intervalSecs","type":"uint64"}],"outputs":[{"type":"uint256"}]},
  { "type":"function","name":"settleIfDue","stateMutability":"payable","inputs":[{"name":"id","type":"uint256"}],"outputs":[]},
  { "type":"function","name":"plans","stateMutability":"view","inputs":[{"name":"id","type":"uint256"}],"outputs":[
    {"name":"payer","type":"address"},{"name":"payee","type":"address"},{"name":"amount","type":"uint256"},{"name":"intervalSecs","type":"uint64"},{"name":"nextDue","type":"uint64"},{"name":"active","type":"bool"}
  ]}
] as const

const account = privateKeyToAccount(PRIVATE_KEY)
const transport = http(RPC)
const publicClient = createPublicClient({ transport, chain: { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 }, rpcUrls: { default: { http: [RPC] } } } })
const walletClient = createWalletClient({ transport, account, chain: { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 }, rpcUrls: { default: { http: [RPC] } } })

const autopay = getContract({ address: AUTOPAY, abi: ABI, client: { public: publicClient, wallet: walletClient } })

// Simple rule JSON: [{ "planId": 1, "rule": "every 1 minute if always", "maxPerRun": 1 }]
const rules = JSON.parse(fs.readFileSync('./rules/sample.rules.json', 'utf8')) as Array<{planId:number, rule:string, maxPerRun?:number}>

function due(now: number, nextDue: number) { return now >= nextDue }

// Very naive "AI": support "every N minute(s)/hour(s)/day(s) if always"
function evaluateRule(rule: string): boolean {
  // extend here to parse metrics, etc.
  return /if\s+always$/i.test(rule.trim())
}

async function settle(planId: number) {
  const plan = await autopay.read.plans([BigInt(planId)])
  if (!plan[5]) { console.log(`Plan ${planId} inactive`); return }
  const now = Math.floor(Date.now()/1000)
  if (!due(now, Number(plan[4]))) { console.log(`Plan ${planId} not due`); return }
  const amount = plan[2] as bigint

  console.log(`Settling plan ${planId} for ${formatUnits(amount, 6)} USDC ...`)
  const hash = await autopay.write.settleIfDue([BigInt(planId)], { value: amount, account })
  console.log(`tx: ${hash}`)
}

async function main() {
  console.log(`Arc RPC: ${RPC}`)
  console.log(`Autopay: ${AUTOPAY}`)
  for (const r of rules) {
    const ok = evaluateRule(r.rule)
    if (ok) {
      await settle(r.planId)
    } else {
      console.log(`Rule not satisfied for plan ${r.planId}`)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
