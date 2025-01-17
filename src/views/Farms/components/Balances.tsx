import { getMasterChefContract, getBaoSupply, getReferrals } from 'bao/utils'
import BigNumber from 'bignumber.js'
import Card from 'components/Card'
import CardContent from 'components/CardContent'
import Label from 'components/Label'
import BaoIcon from 'components/BaoIcon'
import Spacer from 'components/Spacer'
import Value from 'components/Value'
import useAllEarnings from 'hooks/useAllEarnings'
import useAllStakedValue from 'hooks/useAllStakedValue'
import useBao from 'hooks/useBao'
import useFarms from 'hooks/useFarms'
import useTokenBalance from 'hooks/useTokenBalance'
import React, { Fragment, useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { useWallet } from 'use-wallet'
import { getBalanceNumber } from 'utils/numberFormat'
import {
	Footnote,
	FootnoteValue,
	StyledBalance,
	StyledBalances,
	StyledWrapper,
} from './styles'

const PendingRewards: React.FC = () => {
	const [start, setStart] = useState(0)
	const [end, setEnd] = useState(0)
	const [scale, setScale] = useState(1)

	const allEarnings = useAllEarnings()
	let sumEarning = 0
	for (const earning of allEarnings) {
		sumEarning += new BigNumber(earning)
			.div(new BigNumber(10).pow(18))
			.toNumber()
	}

	const [farms] = useFarms()
	const allStakedValue = useAllStakedValue()

	if (allStakedValue && allStakedValue.length) {
		const sumWeth = farms.reduce(
			(c, { id }, i) => c + (allStakedValue[i].totalWethValue.toNumber() || 0),
			0,
		)
	}

	useEffect(() => {
		setStart(end)
		setEnd(sumEarning)
	}, [sumEarning])

	return (
		<span
			style={{
				transform: `scale(${scale})`,
				transformOrigin: 'right bottom',
				transition: 'transform 200ms',
				display: 'inline-block',
			}}
		>
			<CountUp
				start={start}
				end={end}
				decimals={end < 0 ? 4 : end > 1e5 ? 0 : 3}
				duration={1}
				onStart={() => {
					setScale(1.25)
					setTimeout(() => setScale(1), 600)
				}}
				separator=","
			/>
		</span>
	)
}

const Balances: React.FC = () => {
	const [totalSupply, setTotalSupply] = useState<BigNumber>()
	const [totalReferrals, setTotalReferrals] = useState<string>()
	const [refLink, setRefLink] = useState<string>()
	const bao = useBao()
	const baoBalance = useTokenBalance(
		bao && bao.getContract('polly').options.address,
	)
	const masterChefContract = getMasterChefContract(bao)
	const { account, ethereum }: { account: any; ethereum: any } = useWallet()

	useEffect(() => {
		async function fetchTotalSupply() {
			const supply = await getBaoSupply(bao)
			setTotalSupply(supply)
		}
		if (bao) {
			fetchTotalSupply()
		}
	}, [bao, setTotalSupply])

	useEffect(() => {
		async function fetchTotalReferrals() {
			const referrals = await getReferrals(masterChefContract, account)
			setTotalReferrals(referrals)
		}
		if (bao) {
			fetchTotalReferrals()
		}
	}, [bao, setTotalReferrals])

	useEffect(() => {
		async function fetchRefLink() {
			const usrReflink = 'www.baofinance.com?ref=' + account
			setRefLink(usrReflink)
		}
		if (bao) {
			fetchRefLink()
		}
	}, [bao, setRefLink])

	return (
		<Fragment>
			<StyledWrapper>
				<Card>
					<CardContent>
						<StyledBalances>
							<StyledBalance>
								<BaoIcon />
								<Spacer />
								<div style={{ flex: 1 }}>
									<Label text="Your BAO Balance" />
									<Value
										value={account ? getBalanceNumber(baoBalance) : 'Locked'}
									/>
								</div>
							</StyledBalance>
						</StyledBalances>
					</CardContent>
					<Footnote>
						Pending harvest
						<FootnoteValue>
							<PendingRewards /> BAO
						</FootnoteValue>
					</Footnote>
				</Card>
				<Spacer />

				<Card>
					<CardContent>
						<Label text="Total BAO Supply" />
						<Value
							value={totalSupply ? getBalanceNumber(totalSupply) : 'Locked'}
						/>
					</CardContent>
					<Footnote>
						New rewards per block
						<FootnoteValue>5 BAO</FootnoteValue>
					</Footnote>
				</Card>
			</StyledWrapper>
			<Spacer />
		</Fragment>
	)
}

export default Balances
