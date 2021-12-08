import { SupportedMarket } from 'bao/lib/types'
import { useAccountLiquidity } from 'hooks/hard-synths/useAccountLiquidity'
import {
	useBorrowBalances,
	useSupplyBalances,
} from 'hooks/hard-synths/useBalances'
import { useExchangeRates } from 'hooks/hard-synths/useExchangeRates'
import { useMarketPrices } from 'hooks/hard-synths/usePrices'
import React from 'react'
import styled from 'styled-components'
import { MarketOperations } from './Modals'
import BigNumber from 'bignumber.js'
import { decimate, getDisplayBalance } from '../../../utils/numberFormat'

type Stat = {
	label: string
	value: string
	subvalue?: string
}

type StatBlockProps = {
	label: string
	stats: Stat[]
}

type MarketStatBlockProps = {
	title?: string
	asset: SupportedMarket
	amount?: number
}

type MarketStatProps = {
	asset: SupportedMarket
	amount: string
	operation: MarketOperations
}

export const StatBlock = ({ label, stats }: StatBlockProps) => (
	<>
		<StatHeader>
			<p>{label}</p>
		</StatHeader>
		<StatWrapper>
			{stats.map(({ label, value, subvalue }) => (
				<StatText key={label}>
					<p style={{ verticalAlign: 'text-top' }}>{label}</p>
					<StatStack>
						<p className="value">{value}</p>
						<p className="subvalue">{subvalue}</p>
					</StatStack>
				</StatText>
			))}
		</StatWrapper>
	</>
)
const SupplyDetails = ({ asset }: MarketStatBlockProps) => {
	const supplyBalances = useSupplyBalances()
	const { exchangeRates } = useExchangeRates()

	const supplyBalance =
		supplyBalances &&
		supplyBalances.find(
			(balance) => balance.address.toLowerCase() === asset.token.toLowerCase(),
		) &&
		exchangeRates &&
		exchangeRates[asset.token]
			? supplyBalances.find(
					(balance) =>
						balance.address.toLowerCase() === asset.token.toLowerCase(),
			  ).balance * decimate(exchangeRates[asset.token]).toNumber()
			: 0

	return (
		<StatBlock
			label="Supply Stats"
			stats={[
				{
					label: 'Supply APY',
					value: `${asset.supplyApy.toFixed(2)}%`,
				},
				{
					label: 'Supply Balance',
					value: `${supplyBalance.toFixed(2)} ${asset.underlyingSymbol}`,
				},
			]}
		/>
	)
}

export const MarketDetails = ({ asset, title }: MarketStatBlockProps) => {
	const { prices } = useMarketPrices()
	const totalBorrowsUsd =
		prices && asset.totalBorrows
			? `$${getDisplayBalance(
					asset.totalBorrows *
						decimate(
							prices[asset.token],
							new BigNumber(36).minus(asset.decimals),
						).toNumber(),
					0,
			  )}`
			: '-'

	const totalReservesUsd =
		prices && asset.totalReserves
			? `$${getDisplayBalance(
					asset.totalReserves *
						decimate(
							prices[asset.token],
							new BigNumber(36).minus(asset.decimals),
						).toNumber(),
					0,
			  )}`
			: '-'

	const totalSuppliedUsd =
		prices && asset.supplied
			? `$${getDisplayBalance(
					asset.supplied *
						decimate(
							prices[asset.token],
							new BigNumber(36).minus(asset.decimals),
						).toNumber(),
					0,
			  )}`
			: '-'

	const reserveFactor = asset.reserveFactor
		? `${asset.reserveFactor * 100}%`
		: '-'

	return (
		<StatBlock
			label={title}
			stats={[
				{
					label: 'Collateral Factor',
					value: `${asset.collateralFactor * 100}%`,
				},
				{
					label: 'Inital Margin Factor',
					value: `${asset.imfFactor * 100}%`,
				},
				{
					label: 'Reserve Factor',
					value: reserveFactor,
				},
				{
					label: 'Total Reserves',
					value: totalReservesUsd,

				},
			]}
		/>
	)
}

const BorrowDetails = ({ asset }: MarketStatBlockProps) => {
	const borrowBalances = useBorrowBalances()

	const borrowBalance =
		borrowBalances &&
		borrowBalances.find(
			(_borrowBalance) => _borrowBalance.address === asset.token,
		)
			? borrowBalances.find(
					(_borrowBalance) => _borrowBalance.address === asset.token,
			  ).balance
			: 0

	return (
		<StatBlock
			label="Borrow Stats"
			stats={[
				{
					label: 'Borrow APY',
					value: `${asset.borrowApy.toFixed(2)}%`,
				},
				{
					label: 'Borrow Balance',
					value: `${getDisplayBalance(borrowBalance.toFixed(2), 0)} ${
						asset.underlyingSymbol
					}`,
				},
			]}
		/>
	)
}

const BorrowLimit = ({ asset, amount }: MarketStatBlockProps) => {
	const { prices } = useMarketPrices()
	const accountLiquidity = useAccountLiquidity()

	const change =
		prices && amount
			? asset.collateralFactor *
			  amount *
			  decimate(
					prices[asset.token],
					new BigNumber(36).minus(asset.decimals),
			  ).toNumber()
			: 0
	const borrowable = accountLiquidity
		? accountLiquidity.usdBorrow + accountLiquidity.usdBorrowable
		: 0
	const newBorrowable = borrowable + change

	return (
		<StatBlock
			label="Borrow Limit Stats"
			stats={[
				{
					label: 'Borrow Limit',
					value: `$${getDisplayBalance(
						borrowable.toFixed(2),
						0,
					)} ➜ $${getDisplayBalance(newBorrowable.toFixed(2), 0)}`,
				},
				{
					label: 'Borrow Limit Used',
					value: `${(accountLiquidity && borrowable !== 0
						? (accountLiquidity.usdBorrow / borrowable) * 100
						: 0
					).toFixed(2)}% ➜ ${(accountLiquidity && newBorrowable !== 0
						? (accountLiquidity.usdBorrow / newBorrowable) * 100
						: 0
					).toFixed(2)}%`,
				},
			]}
		/>
	)
}

const BorrowLimitRemaining = ({ asset, amount }: MarketStatBlockProps) => {
	const { prices } = useMarketPrices()
	const accountLiquidity = useAccountLiquidity()
	const change =
		prices && amount
			? amount *
			  decimate(
					prices[asset.token],
					new BigNumber(36).minus(asset.decimals),
			  ).toNumber()
			: 0

	const borrow = accountLiquidity ? accountLiquidity.usdBorrow : 0

	const newBorrow = borrow ? borrow - (change > 0 ? change : 0) : 0

	const borrowable = accountLiquidity
		? accountLiquidity.usdBorrow + accountLiquidity.usdBorrowable
		: 0

	const newBorrowable = borrowable ? borrowable + (change < 0 ? change : 0) : 0

	return (
		<StatBlock
			label="Borrow Limit Stats"
			stats={[
				{
					label: 'Borrow Limit Remaining',
					value: `$${getDisplayBalance(
						accountLiquidity ? accountLiquidity.usdBorrowable.toFixed(2) : 0,
						0,
					)} ➜ $${getDisplayBalance(
						accountLiquidity ? accountLiquidity.usdBorrowable + change : 0,
						0,
					)}`,
				},
				{
					label: 'Borrow Limit Used',
					value: `${(borrowable !== 0
						? (borrow / borrowable) * 100
						: 0
					).toFixed(2)}% ➜ ${(newBorrowable !== 0
						? (newBorrow / newBorrowable) * 100
						: 0
					).toFixed(2)}%`,
				},
			]}
		/>
	)
}

export const MarketStats = ({ operation, asset, amount }: MarketStatProps) => {
	const parsedAmount = amount && !isNaN(amount as any) ? parseFloat(amount) : 0
	switch (operation) {
		case MarketOperations.supply:
			return (
				<>
					<SupplyDetails asset={asset} />
					<BorrowLimit asset={asset} amount={parsedAmount} />
				</>
			)
		case MarketOperations.withdraw:
			return (
				<>
					<SupplyDetails asset={asset} />
					<BorrowLimit asset={asset} amount={-1 * parsedAmount} />
				</>
			)
		case MarketOperations.borrow:
			return (
				<>
					<BorrowDetails asset={asset} />
					<BorrowLimitRemaining asset={asset} amount={-1 * parsedAmount} />
				</>
			)
		case MarketOperations.repay:
			return (
				<>
					<BorrowDetails asset={asset} />
					<BorrowLimitRemaining asset={asset} amount={parsedAmount} />
				</>
			)
	}

	return <></>
}

const StatStack = styled.div`
	p {
		text-align: end;
	}

	.value {
		display: block;
	}

	.subvalue {
		display: none;
	}

	&:hover {
		cursor: default;
		.value {
			display: none;
		}

		.subvalue {
			display: block;
		}
	}
`

const StatWrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	padding-top: ${(props) => props.theme.spacing[2]};
	margin-top: 0.25rem;
	margin-inline: 0px;
	margin-bottom: 0px;
	background: ${(props) => props.theme.color.primary[200]};
	padding: 16px;
	border-radius: 8px;
`

const StatHeader = styled.div`
	color: ${(props) => props.theme.color.text[200]};
	font-size: ${(props) => props.theme.fontSize.sm};
	font-weight: ${(props) => props.theme.fontWeight.strong};
	text-align: center;
	margin-top: 0.5rem;

	p {
		margin-top: 0.25rem;
		margin-inline: 0px;
		margin-bottom: 0px;
	}
`

const StatText = styled.div`
	transition-property: all;
	transition-duration: 200ms;
	transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	font-weight: ${(props) => props.theme.fontWeight.medium};
	font-size: ${(props) => props.theme.fontSize.default};
	padding-top: ${(props) => props.theme.spacing[1]}px;
	padding-bottom: ${(props) => props.theme.spacing[1]}px;
	padding-left: ${(props) => props.theme.spacing[2]}px;
	padding-right: ${(props) => props.theme.spacing[2]}px;
	border-radius: 8px;

	p {
		color: ${(props) => props.theme.color.text[100]};
		font-size: ${(props) => props.theme.fontSize.sm};
		font-weight: ${(props) => props.theme.fontWeight.medium};
		display: block;
		margin-block-start: 1em;
		margin-block-end: 1em;
		margin: 0px;
		margin-top: 0px;
		margin-inline: 0.5rem 0px;
		margin-bottom: 0px;
	}

	&:nth-child(odd) {
		background-color: ${(props) => props.theme.color.primary[300]};
	}
`
