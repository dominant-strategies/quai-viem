// formatter.ts
import type { Block, Transaction, Chain, FormattedBlock, RpcBlock, TransactionType, Hex } from 'viem'
import { 
  defineBlock, 
  defineTransaction,
  hexToBigInt,
} from 'viem'
import type { ChainFormatters } from 'viem'

// RPC Types (what we receive from the node)
export type QuaiRpcHeader = {
  baseFeePerGas: `0x${string}`
  efficiencyScore: `0x${string}`
  etxEligibleSlices: `0x${string}`
  etxRollupRoot: `0x${string}`
  etxSetRoot: `0x${string}`
  evmRoot: `0x${string}`
  exchangeRate: `0x${string}`
  expansionNumber: `0x${string}`
  extraData: `0x${string}`
  gasLimit: `0x${string}`
  gasUsed: `0x${string}`
  interlinkRootHash: `0x${string}`
  manifestHash: [`0x${string}`, `0x${string}`, `0x${string}`]
  number: [`0x${string}`, `0x${string}`]
  outboundEtxsRoot: `0x${string}`
  parentDeltaEntropy: [`0x${string}`, `0x${string}`, `0x${string}`]
  parentEntropy: [`0x${string}`, `0x${string}`, `0x${string}`]
  parentHash: [`0x${string}`, `0x${string}`]
  parentUncledDeltaEntropy: [`0x${string}`, `0x${string}`, `0x${string}`]
  primeTerminusHash: `0x${string}`
  qiToQuai: `0x${string}`
  quaiStateSize: `0x${string}`
  quaiToQi: `0x${string}`
  receiptsRoot: `0x${string}`
  secondaryCoinbase: `0x${string}`
  size: `0x${string}`
  stateLimit: `0x${string}`
  stateUsed: `0x${string}`
  thresholdCount: `0x${string}`
  transactionsRoot: `0x${string}`
  uncleHash: `0x${string}`
  uncledEntropy: `0x${string}`
  utxoRoot: `0x${string}`
}

export type QuaiRpcWorkOrderHeader = {
  difficulty: `0x${string}`
  headerHash: `0x${string}`
  location: `0x${string}`
  lock: `0x${string}`
  mixHash: `0x${string}`
  nonce: `0x${string}`
  number: `0x${string}`
  parentHash: `0x${string}`
  primaryCoinbase: `0x${string}`
  primeTerminusNumber: `0x${string}`
  timestamp: `0x${string}`
  txHash: `0x${string}`
}

export type QuaiRpcBlock = Omit<Block, 'transactions'> & {
  hash: `0x${string}`
  header: QuaiRpcHeader
  woHeader: QuaiRpcWorkOrderHeader
  totalEntropy: `0x${string}`
  outboundEtxs: QuaiRpcOutboundETX[]
  transactions: (`0x${string}` | QuaiRpcTransaction)[]
}

export type QuaiTransaction = Omit<Transaction, 'type'> & {
  blockHash: `0x${string}` | null
  blockNumber: bigint | null
  from: `0x${string}`
  gas: bigint
  gasPrice: bigint
  hash: `0x${string}`
  input: `0x${string}`
  nonce: number
  r: `0x${string}`
  s: `0x${string}`
  to: `0x${string}` | null
  transactionIndex: number | null
  type: 'legacy' | 'quai'
  value: bigint
  v: bigint
  chainId: number
  
  // Quai specific fields
  minerTip?: bigint
}

export type QuaiRpcTransaction = {
  blockHash: Hex | null
  blockNumber: Hex | null
  from: Hex
  gas: Hex
  minerTip?: Hex
  gasPrice: Hex
  hash: Hex
  input: Hex
  nonce: Hex
  to: Hex | null
  transactionIndex: Hex | null
  value: Hex
  type: Hex
  chainId: Hex
  v: Hex
  r: Hex
  s: Hex
  accessList?: unknown[]
}

type BaseETX = {
  blockHash: `0x${string}`
  from: `0x${string}`
  hash: `0x${string}`
  input: `0x${string}`
  to: `0x${string}`
  type: `0x${string}`
  accessList: any[]
  originatingTxHash: `0x${string}`
  etxType: `0x${string}`
}

// RPC ETX type (what we receive from the node)
export type QuaiRpcOutboundETX = BaseETX & {
  blockNumber: `0x${string}`
  gas: `0x${string}`
  value: `0x${string}`
  transactionIndex: `0x${string}`
  etxIndex: `0x${string}`
}

// Formatted ETX type (what we return to the user)
export type QuaiOutboundETX = BaseETX & {
  blockNumber: bigint
  gas: bigint
  value: bigint
  transactionIndex: number
  etxIndex: number
}

// Formatted Types (what we return to the user)
// Update QuaiBlock to better match Viem's block format
export type QuaiBlock = FormattedBlock & {
  hash: `0x${string}`
  number: bigint // Map from woHeader.number
  timestamp: bigint // Map from woHeader.timestamp
  parentHash: `0x${string}` // Map from header.parentHash[0]
  nonce: `0x${string}` // Map from woHeader.nonce
  difficulty: bigint // Map from woHeader.difficulty
  gasLimit: bigint // Map from header.gasLimit
  gasUsed: bigint // Map from header.gasUsed
  miner: `0x${string}` // Map from woHeader.primaryCoinbase
  mixHash: `0x${string}` // Map from woHeader.mixHash
  totalDifficulty: bigint // Use woHeader.difficulty as we don't have cumulative
  extraData: `0x${string}` // Map from header.extraData

  // Quai specific fields
  header: {
    baseFeePerGas: bigint
    efficiencyScore: bigint
    exchangeRate: bigint
    quaiNumber: [bigint, bigint] // renamed from number to avoid conflict
    qiToQuai: bigint
    quaiStateSize: bigint
    quaiToQi: bigint
    size: bigint
    stateLimit: bigint
    stateUsed: bigint
    thresholdCount: bigint
  }
  woHeader: QuaiRpcWorkOrderHeader
  totalEntropy: bigint
  outboundEtxs: QuaiOutboundETX[]
}

export const formatters = {
  block: defineBlock({
    format(args: QuaiRpcBlock): QuaiBlock {
      const transactions = args.transactions?.map((transaction) => {
        if (typeof transaction === 'string') return transaction
        return formatters.transaction.format(transaction)
      })

      return {
        ...args,
        // Standard Viem block fields
        number: args.woHeader.number ? hexToBigInt(args.woHeader.number) : 0n,
        timestamp: args.woHeader.timestamp ? hexToBigInt(args.woHeader.timestamp) : 0n,
        parentHash: args.header.parentHash[0],
        nonce: args.woHeader.nonce,
        difficulty: args.woHeader.difficulty ? hexToBigInt(args.woHeader.difficulty) : 0n,
        gasLimit: args.header.gasLimit ? hexToBigInt(args.header.gasLimit) : 0n,
        gasUsed: args.header.gasUsed ? hexToBigInt(args.header.gasUsed) : 0n,
        miner: args.woHeader.primaryCoinbase,
        mixHash: args.woHeader.mixHash,
        totalDifficulty: args.woHeader.difficulty ? hexToBigInt(args.woHeader.difficulty) : 0n,
        extraData: args.header.extraData,
        baseFeePerGas: null,
        receiptsRoot: args.header.receiptsRoot,
        stateRoot: args.header.evmRoot,
        transactionsRoot: args.header.transactionsRoot,

        // Quai specific fields in nested objects
        header: {
          ...args.header,
          baseFeePerGas: args.header.baseFeePerGas ? hexToBigInt(args.header.baseFeePerGas) : 0n,
          efficiencyScore: args.header.efficiencyScore ? hexToBigInt(args.header.efficiencyScore) : 0n,
          exchangeRate: args.header.exchangeRate ? hexToBigInt(args.header.exchangeRate) : 0n,
          quaiNumber: [
            args.header.number?.[0] ? hexToBigInt(args.header.number[0]) : 0n,
            args.header.number?.[1] ? hexToBigInt(args.header.number[1]) : 0n
          ],
          qiToQuai: args.header.qiToQuai ? hexToBigInt(args.header.qiToQuai) : 0n,
          quaiStateSize: args.header.quaiStateSize ? hexToBigInt(args.header.quaiStateSize) : 0n,
          quaiToQi: args.header.quaiToQi ? hexToBigInt(args.header.quaiToQi) : 0n,
          size: args.header.size ? hexToBigInt(args.header.size) : 0n,
          stateLimit: args.header.stateLimit ? hexToBigInt(args.header.stateLimit) : 0n,
          stateUsed: args.header.stateUsed ? hexToBigInt(args.header.stateUsed) : 0n,
          thresholdCount: args.header.thresholdCount ? hexToBigInt(args.header.thresholdCount) : 0n,
        },
        woHeader: args.woHeader,
        totalEntropy: args.totalEntropy ? hexToBigInt(args.totalEntropy) : 0n,
        outboundEtxs: args.outboundEtxs?.map(etx => ({
          ...etx,
          blockNumber: etx?.blockNumber ? hexToBigInt(etx.blockNumber) : 0n,
          gas: etx?.gas ? hexToBigInt(etx.gas) : 0n,
          value: etx?.value ? hexToBigInt(etx.value) : 0n,
          transactionIndex: etx?.transactionIndex ? Number(hexToBigInt(etx.transactionIndex)) : 0,
          etxIndex: etx?.etxIndex ? Number(hexToBigInt(etx.etxIndex)) : 0,
        })) ?? [],
        transactions,
      } as QuaiBlock
    },
  }),

  // Transaction formatter remains the same
  transaction: defineTransaction({
    format(args: QuaiRpcTransaction): QuaiTransaction {
      const formatted: QuaiTransaction = {
        blockHash: args.blockHash ?? null,
        blockNumber: args.blockNumber ? hexToBigInt(args.blockNumber) : null,
        from: args.from,
        gas: args.gas ? hexToBigInt(args.gas) : 0n,
        hash: args.hash,
        input: args.input,
        nonce: args.nonce ? Number(hexToBigInt(args.nonce)) : 0,
        r: args.r,
        s: args.s,
        to: args.to ?? null,
        transactionIndex: args.transactionIndex ? Number(hexToBigInt(args.transactionIndex)) : null,
        typeHex: args.type,
        type: 'legacy',
        value: args.value ? hexToBigInt(args.value) : 0n,
        v: args.v ? hexToBigInt(args.v) : 0n,

        minerTip: args.minerTip ? hexToBigInt(args.minerTip) : undefined,
        gasPrice: args.gasPrice ? hexToBigInt(args.gasPrice) : 0n,
        chainId: args.chainId ? Number(hexToBigInt(args.chainId)) : 0,
      }

      if (args.accessList) {
        // formatted.accessList = args.accessList
      }

      return formatted
    },
  }),
} as const satisfies ChainFormatters

export const quaiChain = {
  id: 12000,
  name: 'Quai Network',
  nativeCurrency: {
    decimals: 18,
    name: 'QUAI',
    symbol: 'QUAI',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:9200'],
    },
    public: {
      http: ['https://rpc.quai.network/cyprus1'],
    },
  },
  formatters,
} as const satisfies Chain