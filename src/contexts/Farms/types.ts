import BigNumber from 'bignumber.js/bignumber'
import { Contract } from 'web3-eth-contract'

export enum PoolType {
  SUSHI = 'sushi',
  BAO = 'bao',
  ARCHIVED = 'archived',
}

export interface Farm {
  pid: number
  name: string
  lpToken: string
  lpTokenAddress: string
  lpContract: Contract
  tokenAddress: string
  tokenDecimals: number
  earnToken: string
  earnTokenAddress: string
  icon: string
  id: string
  tokenSymbol: string
  refUrl: string
  pairUrl: string
  poolType?: PoolType
  tvl?: BigNumber
}

export interface FarmsContext {
  farms: Farm[]
  unharvested: number
}
