import { useCallback, useEffect, useState } from 'react'
import fetcher from 'bao/lib/fetcher'
import { SWR } from 'bao/lib/types'
import useSWR from 'swr'
import useBao from '../useBao'
import MultiCall from '../../utils/multicall'
import Config from '../../bao/lib/config'
import BigNumber from 'bignumber.js'

type Prices = {
  prices: {
    [key: string]: {
      usd: number
    }
  }
}

export const usePrice = (coingeckoId: string): SWR & Prices => {
  const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${coingeckoId}`
  const { data, error } = useSWR(url, fetcher)

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePrices = (): SWR & Prices => {
  const coingeckoIds = Object.values(Config.markets).map(
    ({ coingeckoId }) => coingeckoId,
  )
  const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${coingeckoIds.join(
    ',',
  )}`
  const { data, error } = useSWR(url, fetcher)

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const useMarketPrices = (): Prices => {
  const bao = useBao()
  const [prices, setPrices] = useState<
    undefined | { [key: string]: { usd: number } }
  >()

  const fetchPrices = useCallback(async () => {
    const tokens = Config.markets.map(
      (market) => market.marketAddresses[Config.networkId],
    )
    const multiCallContext = MultiCall.createCallContext([
      {
        ref: 'MarketOracle',
        contract: bao.getContract('marketOracle'),
        calls: tokens.map((token) => ({
          ref: token,
          method: 'getUnderlyingPrice',
          params: [token],
        })),
      },
    ])
    const data = MultiCall.parseCallResults(
      await bao.multicall.call(multiCallContext),
    )

    setPrices(
      data['MarketOracle'].reduce(
        (_prices: { [key: string]: { usd: number } }, result: any) => ({
          ..._prices,
          [result.ref]: new BigNumber(result.values[0].hex).toNumber(),
        }),
        {},
      ),
    )
  }, [bao])

  useEffect(() => {
    if (!bao) return
    fetchPrices()
  }, [bao])

  return {
    prices,
  }
}
