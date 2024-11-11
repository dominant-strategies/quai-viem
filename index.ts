import { 
    createPublicClient,
    defineChain,
    http
  } from 'viem' 
  
  import { quaiChain } from './formatter'
     
  export const example = defineChain(quaiChain)
  
  const publicClient = createPublicClient({ 
    chain: quaiChain,
    transport: http()
  })
  
  ;(async () => {
    try {
      // Example of getting a block
      const block = await publicClient.getBlock()

      console.log(block.header)
      console.log('Latest block:', {
        hash: block.hash,
        number: block.number,
        timestamp: block.timestamp
      })
    } catch (error) {
      console.error('Error:', error)
    }
  })()