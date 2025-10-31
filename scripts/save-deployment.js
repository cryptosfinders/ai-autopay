
// node scripts/save-deployment.js 0xDeployedAddress
import fs from 'node:fs'
const addr = process.argv[2]
if (!addr) { console.error('Usage: node scripts/save-deployment.js 0x...'); process.exit(1) }
const file = new URL('../deployments/arc-testnet.json', import.meta.url).pathname
fs.writeFileSync(file, JSON.stringify({ Autopay: addr }, null, 2))
console.log('Saved to', file)
