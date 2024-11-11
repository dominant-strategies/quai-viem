import { 
    createPublicClient, 
    defineChain, 
    http,
    type PublicClient,
    type Transport,
    type Chain,
  } from 'viem'
  import type { QuaiBlock, QuaiTransaction } from './formatter'
  
  export type QuaiClient = PublicClient & {
    quai: {
      getBlock: (args?: { blockHash?: `0x${string}`, blockNumber?: bigint }) => Promise<QuaiBlock>
      getTransaction: (hash: `0x${string}`) => Promise<QuaiTransaction>
    }
  }

  
  // need to find out how to extend client in order to pass quai_ calls instead of eth_ calls here
  export function publicClientToQuaiClient(client: PublicClient): QuaiClient {
    return client.extend((client) => ({
      quai: {
        async getBlock(args?: { blockHash?: `0x${string}`, blockNumber?: bigint }) {
          if (args?.blockHash) {
            return client.request({
              method: 'quai_getBlockByHash',
              params: [args.blockHash, true]
            })
          }
          
          return client.request({
            method: 'quai_getBlockByNumber',
            params: [args?.blockNumber ? 
              `0x${args.blockNumber.toString(16)}` : 
              'latest', 
              true
            ]
          })
        },
  
        async getTransaction(hash: `0x${string}`) {
          return client.request({
            method: 'quai_getTransactionByHash',
            params: [hash]
          })
        }
      }
    }))
  }
  
  // Usage example
  import { quaiChain } from './formatter'
  
  export function createQuaiClient({ 
    chain = quaiChain, 
    transport = http() 
  } = {}): QuaiClient {
    const client = createPublicClient({
      chain,
      transport
    })
  
    return publicClientToQuaiClient(client)
  }