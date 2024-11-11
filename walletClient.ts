// wallet.ts
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { quaiChain } from './formatter'
import { createQuaiTransport } from './quaiTransport'

// Load from environment variable
const PRIVATE_KEY = ``

async function main() {
  try {
    // Create account from private key
    const account = privateKeyToAccount(PRIVATE_KEY)

    // Create wallet client
    const client = createWalletClient({
      account,
      chain: quaiChain,
      transport: createQuaiTransport()
    })

    // Get account address
    const address = account.address
    console.log('Account address:', address)

    // Example transaction
    const hash = await client.sendTransaction({
      to: '0x0039e2f592dc7D2F46864E094A7160EDa73dB35e',
      value: 1000000000000000000n // 1 QUAI
    })
    
    console.log('Transaction hash:', hash)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()