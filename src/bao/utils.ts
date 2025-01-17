import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import _ from 'lodash'
import { Contract } from 'web3-eth-contract'
import { Farm } from '../contexts/Farms'
import Multicall from '../utils/multicall'
import { decimate, exponentiate } from '../utils/numberFormat'
import { Bao } from './Bao'
import Config from './lib/config'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

export const getWethContract = (bao: Bao): Contract => {
  return bao && bao.contracts && bao.getContract('weth')
}

export const getWethPriceContract = (bao: Bao): Contract => {
  return bao && bao.contracts && bao.getContract('wethPrice')
}

export const getComptrollerContract = (bao: Bao): Contract => {
  return bao && bao.contracts && bao.getContract('comptroller')
}

export const getMasterChefContract = (bao: Bao): Contract => {
  return bao && bao.contracts && bao.getContract('masterChef')
}

export const getBaoContract = (bao: Bao): Contract => {
  return bao && bao.contracts && bao.getContract('polly')
}

export const getBasketContract = (
  bao: Bao,
  nid: number,
): Contract | undefined => {
  if (bao && bao.contracts && bao.contracts.baskets)
    return _.find(bao.contracts.baskets, { nid }).basketContract
}

export const getRecipeContract = (bao: Bao) => {
  return bao && bao.contracts && bao.getContract('recipe')
}

export const getMarkets = (bao: Bao) => {
  return bao
    ? bao.contracts.markets.map(
        ({
          token,
          underlying,
          supplyApy,
          borrowApy,
          borrowable,
          liquidity,
          totalReserves,
          totalBorrows,
          collateralFactor,
          reserveFactor,
          supplied,
          decimals,
        }) => ({
          token,
          underlying,
          supplyApy,
          borrowApy,
          borrowable,
          liquidity,
          totalReserves,
          totalBorrows,
          collateralFactor,
          reserveFactor,
          supplied,
          decimals,
        }),
      )
    : []
}

export const getBaskets = (bao: Bao) => {
  return bao
    ? bao.contracts.baskets.map(
        ({
          nid,
          name,
          symbol,
          icon,
          basketAddress,
          basketContract,
          pieColors,
        }) => ({
          nid,
          id: symbol,
          name,
          icon,
          basketContract,
          pieColors,
          basketTokenAddress: basketAddress,
          inputToken: 'wETH',
          basketToken: symbol,
          inputTokenAddress: Config.addressMap.WETH,
        }),
      )
    : []
}

export const getFarms = (bao: Bao): Farm[] => {
  return bao
    ? bao.contracts.pools.map(
        ({
          pid,
          name,
          symbol,
          icon,
          tokenAddress,
          tokenDecimals,
          tokenSymbol,
          tokenContract,
          lpAddress,
          lpContract,
          refUrl,
          pairUrl,
        }) => ({
          pid,
          id: symbol,
          name,
          lpToken: symbol,
          lpTokenAddress: lpAddress,
          lpContract,
          tokenAddress,
          tokenDecimals,
          tokenSymbol,
          tokenContract,
          earnToken: 'POLLY',
          earnTokenAddress: bao.getContract('polly').options.address,
          icon,
          refUrl,
          pairUrl,
        }),
      )
    : []
}

export const getPoolWeight = async (
  masterChefContract: Contract,
  pid: number,
): Promise<BigNumber> => {
  const [{ allocPoint }, totalAllocPoint] = await Promise.all([
    masterChefContract.methods.poolInfo(pid).call(),
    masterChefContract.methods.totalAllocPoint().call(),
  ])

  return new BigNumber(allocPoint).div(new BigNumber(totalAllocPoint))
}

export const getEarned = async (
  masterChefContract: Contract,
  pid: number,
  account: string,
): Promise<BigNumber> => {
  return masterChefContract.methods.pendingReward(pid, account).call()
}

export const getLockedEarned = async (
  baoContract: Contract,
  account: string,
): Promise<BigNumber> => {
  return baoContract.methods.lockOf(account).call()
}

export const getTotalLPWethValue = async (
  masterChefContract: Contract,
  wethContract: Contract,
  lpContract: Contract,
  tokenContract: Contract,
  tokenDecimals: number,
  pid: number,
): Promise<{
  tokenAmount: BigNumber
  wethAmount: BigNumber
  totalWethValue: BigNumber
  tokenPriceInWeth: BigNumber
  poolWeight: BigNumber
}> => {
  const [tokenAmountWholeLP, balance, totalSupply, lpContractWeth, poolWeight] =
    await Promise.all([
      tokenContract.methods.balanceOf(lpContract.options.address).call(),
      lpContract.methods.balanceOf(masterChefContract.options.address).call(),
      lpContract.methods.totalSupply().call(),
      wethContract.methods.balanceOf(lpContract.options.address).call(),
      getPoolWeight(masterChefContract, pid),
    ])

  // Return p1 * w1 * 2
  const portionLp = new BigNumber(balance).div(new BigNumber(totalSupply))
  const lpWethWorth = new BigNumber(lpContractWeth)
  const totalLpWethValue = portionLp.times(lpWethWorth).times(new BigNumber(2))
  // Calculate
  const tokenAmount = new BigNumber(tokenAmountWholeLP)
    .times(portionLp)
    .div(new BigNumber(10).pow(tokenDecimals))

  const wethAmount = new BigNumber(lpContractWeth)
    .times(portionLp)
    .div(new BigNumber(10).pow(18))
  return {
    tokenAmount,
    wethAmount,
    totalWethValue: totalLpWethValue.div(new BigNumber(10).pow(18)),
    tokenPriceInWeth: wethAmount.div(tokenAmount),
    poolWeight: poolWeight,
  }
}

export const approve = async (
  lpContract: Contract,
  masterChefContract: Contract,
  account: string,
): Promise<string> => {
  return lpContract.methods
    .approve(masterChefContract.options.address, ethers.constants.MaxUint256)
    .send({ from: account })
}

export const approvev2 = (
  token: Contract,
  spender: Contract,
  account: string,
) => {
  return token.methods
    .approve(spender.options.address, ethers.constants.MaxUint256)
    .send({ from: account })
}

export const stake = async (
  masterChefContract: Contract,
  pid: number,
  amount: string,
  account: string,
  ref: string,
): Promise<string> => {
  return masterChefContract.methods
    .deposit(pid, ethers.utils.parseUnits(amount, 18), ref)
    .send({ from: account })
    .on('transactionHash', (tx: { transactionHash: string }) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const unstake = async (
  masterChefContract: Contract,
  pid: number,
  amount: string,
  account: string,
  ref: string,
): Promise<string> => {
  return masterChefContract.methods
    .withdraw(pid, ethers.utils.parseUnits(amount, 18), ref)
    .send({ from: account })
    .on('transactionHash', (tx: { transactionHash: string }) => {
      console.log(tx)
      return tx.transactionHash
    })
}
export const harvest = async (
  masterChefContract: Contract,
  pid: number,
  account: string,
): Promise<string> => {
  return masterChefContract.methods
    .claimReward(pid)
    .send({ from: account })
    .on('transactionHash', (tx: { transactionHash: string }) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const getStaked = async (
  masterChefContract: Contract,
  pid: number,
  account: string,
): Promise<BigNumber> => {
  try {
    const { amount } = await masterChefContract.methods
      .userInfo(pid, account)
      .call()
    return new BigNumber(amount)
  } catch {
    return new BigNumber(0)
  }
}

export const getBaoSupply = async (bao: Bao) => {
  return new BigNumber(
    await bao.getContract('polly').methods.totalSupply().call(),
  )
}

export const getReferrals = async (
  masterChefContract: Contract,
  account: string,
): Promise<string> => {
  return await masterChefContract.methods.getGlobalRefAmount(account).call()
}

export const getRefUrl = (): string => {
  let refer = '0x0000000000000000000000000000000000000000'
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.has('ref')) {
    refer = urlParams.get('ref')
  }
  console.log(refer)

  return refer
}

export const redeem = async (
  masterChefContract: Contract,
  account: string,
): Promise<string> => {
  const now = new Date().getTime() / 1000
  if (now >= 1597172400) {
    return masterChefContract.methods
      .exit()
      .send({ from: account })
      .on('transactionHash', (tx: { transactionHash: string }) => {
        console.log(tx)
        return tx.transactionHash
      })
  } else {
    alert('pool not active')
  }
}

export const enter = async (
  contract: Contract | undefined,
  amount: string,
  account: string,
): Promise<string> => {
  return contract?.methods
    .enter(exponentiate(amount).toString())
    .send({ from: account })
    .on('transactionHash', (tx: { transactionHash: string }) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const leave = async (
  contract: Contract,
  amount: string,
  account: string,
): Promise<string> => {
  return contract.methods
    .leave(exponentiate(amount).toString())
    .send({ from: account })
    .on('transactionHash', (tx: { transactionHash: string }) => {
      console.log(tx)
      return tx.transactionHash
    })
}

export const fetchCalcToBasket = async (
  recipeContract: Contract,
  basketAddress: string,
  basketAmount: string,
) => {
  const amount = exponentiate(basketAmount)
  const amountEthNecessary = await recipeContract.methods
    .calcToPie(basketAddress, amount.toFixed(0))
    .call()
  return decimate(amountEthNecessary)
}

export const basketIssue = (
  recipeContract: Contract,
  _outputToken: string,
  _inputToken: string,
  _maxInput: BigNumber,
  _data: string,
  account: string,
) =>
  recipeContract.methods
    .bake(_inputToken, _outputToken, exponentiate(_maxInput).toString(), _data)
    .send({ from: account })

export const basketRedeem = (
  basketContract: Contract,
  amount: string,
  account: string,
) =>
  basketContract.methods
    .exitPool(exponentiate(amount).toString())
    .send({ from: account })

export const getWethPriceLink = async (bao: Bao): Promise<BigNumber> => {
  const priceOracle = bao.contracts.getContract('wethPrice')
  const { wethPrice } = Multicall.parseCallResults(
    await bao.multicall.call(
      Multicall.createCallContext([
        {
          ref: 'wethPrice',
          contract: priceOracle,
          calls: [{ method: 'decimals' }, { method: 'latestRoundData' }],
        },
      ]),
    ),
  )

  return new BigNumber(wethPrice[1].values[1].hex).div(
    10 ** wethPrice[0].values[0],
  )
}

export const getUserInfoChef = async (
  masterChefContract: Contract,
  pid: number,
  account: string,
) => await masterChefContract.methods.userInfo(pid, account).call()

export const getAccountLiquidity = async (
  comptrollerContract: Contract,
  account: string,
) => await comptrollerContract.methods.getAccountLiquidity(account).call()