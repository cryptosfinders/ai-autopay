
import { ethers } from "https://esm.sh/ethers@6.13.2"

const chainId = 5042002
const chainParams = {
  chainId: "0x" + chainId.toString(16),
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"]
}

const ABI = [
  { "type":"function","name":"createPlan","stateMutability":"nonpayable","inputs":[{"name":"payee","type":"address"},{"name":"amount","type":"uint256"},{"name":"intervalSecs","type":"uint64"}],"outputs":[{"type":"uint256"}]},
  { "type":"function","name":"settleIfDue","stateMutability":"payable","inputs":[{"name":"id","type":"uint256"}],"outputs":[]}
]

const deployments = await fetch('../deployments/arc-testnet.json').then(r=>r.json())
const AUTOPAY = deployments.Autopay

const log = (m)=>{ document.getElementById('log').textContent += m + "\n" }

async function ensureArc() {
  const provider = window.ethereum
  if (!provider) { alert('Install MetaMask'); throw new Error('no metamask') }
  const current = await provider.request({ method:'eth_chainId' })
  if (parseInt(current, 16) !== chainId) {
    try {
      await provider.request({ method:'wallet_switchEthereumChain', params:[{ chainId: chainParams.chainId }] })
    } catch (e) {
      await provider.request({ method:'wallet_addEthereumChain', params:[chainParams] })
    }
  }
}

document.getElementById('connect').onclick = async () => {
  await ensureArc()
  const accounts = await ethereum.request({ method:'eth_requestAccounts' })
  document.getElementById('account').textContent = accounts[0]
  log('Connected: ' + accounts[0])
}

document.getElementById('create').onclick = async () => {
  await ensureArc()
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const c = new ethers.Contract(AUTOPAY, ABI, signer)
  const payee = document.getElementById('payee').value
  const amountStr = document.getElementById('amount').value
  const amount = Math.round(parseFloat(amountStr) * 1e6) // USDC 6 decimals (native)
  const interval = parseInt(document.getElementById('interval').value)
  const tx = await c.createPlan(payee, amount, interval)
  const rc = await tx.wait()
  log('Plan created tx: ' + rc.hash)
}

document.getElementById('settle').onclick = async () => {
  await ensureArc()
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const c = new ethers.Contract(AUTOPAY, ABI, signer)
  const planId = parseInt(document.getElementById('planId').value)
  // fetch plan to know amount? For demo, ask user to send amount == due
  // A tighter UX would add a view to read plan amount and auto attach value.
  const amountStr = prompt('Enter amount to send (USDC):')
  const amount = Math.round(parseFloat(amountStr) * 1e6)
  const tx = await c.settleIfDue(planId, { value: amount })
  const rc = await tx.wait()
  log('Settled tx: ' + rc.hash)
}
