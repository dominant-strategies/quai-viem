// quaiTransport.ts
import { 
    type CustomTransport,
    custom,
    hexToBytes,
    parseTransaction,
    Transaction,
    numberToHex,
    hexToBigInt,
    type Hex
  } from 'viem'
  import protobuf from 'protobufjs'
  
  // Define the protobuf schema
  const transactionProto = `
  syntax = "proto3";
  
  message Transaction {
    bytes to = 1;
    bytes value = 2;
    uint64 nonce = 3;
    uint64 gas_limit = 4;
    bytes gas_price = 5;
    bytes data = 6;
    uint64 chain_id = 7;
    bytes v = 8;
    bytes r = 9;
    bytes s = 10;
  }
  `
  
  const root = protobuf.parse(transactionProto).root
  const TransactionMessage = root.lookupType('Transaction')
  
  // Helper functions for safe conversions
  function safeHexToBytes(hex: Hex | undefined | null, defaultValue: Uint8Array = new Uint8Array()): Uint8Array {
    if (!hex) return defaultValue
    return hexToBytes(hex)
  }

  function safeBigIntToBytes(value: bigint | undefined | null, defaultValue: bigint = 0n): Uint8Array {
    const bigIntValue = value ?? defaultValue
    const hex = numberToHex(bigIntValue, { size: 32 })
    return hexToBytes(hex)
  }
  
  function safeNumberToBytes(value: number | undefined | null, defaultValue: number = 0): Uint8Array {
    const numberValue = value ?? defaultValue
    const hex = numberToHex(numberValue, { size: 8 })
    return hexToBytes(hex)
  }
  
  interface QuaiTransportConfig {
    rpcUrl?: string
    timeout?: number
  }
  
  export function createQuaiTransport(config: QuaiTransportConfig = {}): CustomTransport {
    const {
      rpcUrl = 'http://localhost:9200',
      timeout = 10000
    } = config
  
    return custom({
      async request({ method, params }) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)
  
          if (method === 'eth_sendRawTransaction') {
            const rawTx = params[0] as `0x${string}`
            const parsedTx = parseTransaction(rawTx)
  
            // Create protobuf message with safe conversions
            const message = TransactionMessage.create({
              to: safeHexToBytes(parsedTx.to),
              value: safeBigIntToBytes(parsedTx.value),
              nonce: Number(parsedTx.nonce ?? 0),
              gasLimit: Number(parsedTx.gas ?? 0),
              gasPrice: safeBigIntToBytes(parsedTx.gasPrice),
              data: safeHexToBytes(parsedTx.data, new Uint8Array()),
              chainId: Number(parsedTx.chainId ?? 0),
              v: safeBigIntToBytes(parsedTx.v),
              r: safeHexToBytes(parsedTx.r),
              s: safeHexToBytes(parsedTx.s)
            })
  
            // Verify the message
            const error = TransactionMessage.verify(message)
            if (error) {
              throw new Error(`Invalid transaction: ${error}`)
            }
  
            // Encode to protobuf
            const encodedTx = TransactionMessage.encode(message).finish()
            const protoHex = `0x${Buffer.from(encodedTx).toString('hex')}`
  
            // Update params with protobuf encoded transaction
            params = [protoHex]
          }
  
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method,
              params
            }),
            signal: controller.signal
          })
  
          clearTimeout(timeoutId)
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
  
          const data = await response.json()
          
          if (data.error) {
            throw new Error(data.error.message || 'RPC Error')
          }
  
          return data.result
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout')
          }
          throw error
        }
      }
    })
  }