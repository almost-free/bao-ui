import { getEarned, getMasterChefContract } from 'bao/utils'
import BigNumber from 'bignumber.js'
import { Button } from 'components/Button'
import Card from 'components/Card'
import CardContent from 'components/CardContent'
import CardIcon from 'components/CardIcon'
import { SpinnerLoader } from 'components/Loader'
import Spacer from 'components/Spacer'
import Tooltipped from 'components/Tooltipped'
import { Farm } from 'contexts/Farms'
import { PoolType } from 'contexts/Farms/types'
import useBao from 'hooks/useBao'
import useFarms from 'hooks/useFarms'
import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Row, Col, Container, Accordion } from 'react-bootstrap'
import type { CountdownRenderProps } from 'react-countdown'
import Countdown from 'react-countdown'
import { TabPanel, Tabs } from 'react-tabs'
import 'react-tabs/style/react-tabs.css'
import { useWallet } from 'use-wallet'
import { bnToDec } from 'utils'
import Config from '../../../bao/lib/config'
import useAllFarmTVL from '../../../hooks/useAllFarmTVL'
import GraphUtil from '../../../utils/graph'
import Multicall from '../../../utils/multicall'
import { decimate, getDisplayBalance } from '../../../utils/numberFormat'
import {
	StyledCardAccent,
	StyledCards,
	StyledCardWrapper,
	StyledContent,
	StyledDetail,
	StyledDetails,
	StyledInsight,
	StyledLoadingWrapper,
	StyledSpacer,
	StyledTitle,
} from './styles'
import ExternalLink from 'components/ExternalLink'
import './tab-styles.css'
import styled from 'styled-components'
import { useParams } from 'react-router-dom'
import useFarm from 'hooks/useFarm'
import { getContract } from 'utils/erc20'
import useRedeem from 'hooks/useRedeem'

interface FarmWithStakedValue extends Farm {
	apy: BigNumber
	stakedUSD: BigNumber
}

export const FarmList: React.FC = () => {
	const bao = useBao()
	const [farms] = useFarms()
	const farmsTVL = useAllFarmTVL(bao && bao.web3, bao && bao.multicall)
	const { ethereum, account } = useWallet()

	const [pollyPrice, setPollyPrice] = useState<BigNumber | undefined>()
	const [pools, setPools] = useState<any | undefined>({
		[PoolType.BAO]: [],
		[PoolType.SUSHI]: [],
		[PoolType.ARCHIVED]: [],
	})

	useEffect(() => {
		GraphUtil.getPrice(Config.addressMap.WETH).then(async (wethPrice) => {
			const pollyPrice = await GraphUtil.getPriceFromPair(
				wethPrice,
				Config.contracts.polly[Config.networkId].address,
			)
			setPollyPrice(pollyPrice)
		})

		const _pools: any = {
			[PoolType.BAO]: [],
			[PoolType.SUSHI]: [],
			[PoolType.ARCHIVED]: [],
		}
		if (!(ethereum && farmsTVL && bao) || pools.bao.length)
			return setPools(_pools)

		bao.multicall
			.call(
				Multicall.createCallContext([
					{
						ref: 'masterChef',
						contract: getMasterChefContract(bao),
						calls: farms
							.map((farm, i) => {
								return {
									ref: i.toString(),
									method: 'getNewRewardPerBlock',
									params: [farm.pid + 1],
								}
							})
							.concat(
								farms.map((farm, i) => {
									return {
										ref: (farms.length + i).toString(),
										method: 'userInfo',
										params: [farm.pid, account],
									}
								}) as any,
							),
					},
				]),
			)
			.then(async (_result: any) => {
				const result = await Multicall.parseCallResults(_result)

				for (let i = 0; i < farms.length; i++) {
					const farm = farms[i]
					const tvlInfo = farmsTVL.tvls.find(
						(fTVL: any) =>
							fTVL.lpAddress.toLowerCase() ===
							farm.lpTokenAddress.toLowerCase(),
					)
					const farmWithStakedValue = {
						...farm,
						poolType: farm.poolType || PoolType.BAO,
						tvl: tvlInfo.tvl,
						stakedUSD: decimate(
							result.masterChef[farms.length + i].values[0].hex,
						)
							.div(decimate(tvlInfo.lpStaked))
							.times(tvlInfo.tvl),
						apy:
							pollyPrice && farmsTVL
								? pollyPrice
										.times(BLOCKS_PER_YEAR)
										.times(
											new BigNumber(result.masterChef[i].values[0].hex).div(
												10 ** 18,
											),
										)
										.div(tvlInfo.tvl)
								: null,
					}

					_pools[farmWithStakedValue.poolType].push(farmWithStakedValue)
				}
				setPools(_pools)
			})
	}, [farmsTVL, bao])

	const BLOCKS_PER_YEAR = new BigNumber(13428766) // (60 * 60 * 24 * 365.25) / 2.35 (avg Polygon block time)

	return (
		<>
			<Spacer size="md" />
			<Row>
				<Col>
					<FarmListHeader headers={['Pool', 'APR', 'LP Staked', 'TVL']} />
					{pools[PoolType.BAO] && pools[PoolType.BAO].length ? (
						pools[PoolType.BAO].map((farm: any, i: number) => (
							<React.Fragment key={i}>
								<FarmListItem farm={farm} />
							</React.Fragment>
						))
					) : (
						<StyledLoadingWrapper>
							Experiencing long load times? Consider changing to Polygon's
							unified RPC,{' '}
							<ExternalLink href={'https://polygon-rpc.com'}>
								https://polygon-rpc.com
							</ExternalLink>
							<br />
							<br />
							<SpinnerLoader block />
						</StyledLoadingWrapper>
					)}
				</Col>
			</Row>
		</>
	)
}

type FarmListHeaderProps = {
	headers: string[]
}

const FarmListHeader: React.FC<FarmListHeaderProps> = ({
	headers,
}: FarmListHeaderProps) => {
	return (
		<Container fluid>
			<Row style={{ padding: '0.5rem 12px' }}>
				{headers.map((header: string) => (
					<FarmListHeaderCol style={{ paddingBottom: '0px' }} key={header}>
						<b>{header}</b>
					</FarmListHeaderCol>
				))}
			</Row>
		</Container>
	)
}

interface FarmListItemProps {
	farm: FarmWithStakedValue
}

const FarmListItem: React.FC<FarmListItemProps> = ({ farm }) => {
	const [startTime, setStartTime] = useState(0)
	const [harvestable, setHarvestable] = useState(0)

	const { account } = useWallet()
	const { pid } = farm
	const bao = useBao()

	const renderer = (countdownProps: CountdownRenderProps) => {
		const { hours, minutes, seconds } = countdownProps
		const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds
		const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes
		const paddedHours = hours < 10 ? `0${hours}` : hours
		return (
			<span style={{ width: '100%' }}>
				{paddedHours}:{paddedMinutes}:{paddedSeconds}
			</span>
		)
	}

	useEffect(() => {
		async function fetchEarned() {
			if (bao) return
			const earned = await getEarned(getMasterChefContract(bao), pid, account)
			setHarvestable(bnToDec(earned))
		}
		if (bao && account) {
			fetchEarned()
		}
	}, [bao, pid, account, setHarvestable])

	const poolActive = true // startTime * 1000 - Date.now() <= 0
	const basketMint = 'Get ' + farm.tokenSymbol
	const destination = farm.refUrl
	const pairLink = farm.pairUrl

	return (
		<Accordion>
			<StyledAccordionItem eventKey="0" style={{ padding: '12px' }}>
				<StyledAccordionHeader>
					<Row lg={7} style={{ width: '100%' }}>
						<Col>
							<img src={farm.icon} /> {farm.name}
						</Col>
						<Col>
							{farm.apy ? (
								farm.apy.gt(0) ? (
									`${farm.apy
										.times(new BigNumber(100))
										.toNumber()
										.toLocaleString('en-US')
										.slice(0, -1)}%`
								) : (
									'N/A'
								)
							) : (
								<SpinnerLoader />
							)}
						</Col>
						<Col>{`$${getDisplayBalance(farm.stakedUSD, 0)}`}</Col>
						<Col>{`$${getDisplayBalance(farm.tvl, 0)}`}</Col>
					</Row>
				</StyledAccordionHeader>
				<StyledAccordionBody></StyledAccordionBody>
			</StyledAccordionItem>
		</Accordion>
	)
}

const FarmListHeaderCol = styled(Col)`
	text-align: right;

	&:first-child {
		text-align: left;
	}

	&:last-child {
		margin-right: 46px;
	}
`

const StyledAccordionItem = styled(Accordion.Item)`
	background-color: transparent;
	border-color: transparent;
`

const StyledAccordionBody = styled(Accordion.Body)`
	background-color: ${(props) => props.theme.color.primary[100]};
	border-bottom-left-radius: 8px;
	border-bottom-right-radius: 8px;
	border-top: 2px solid ${(props) => props.theme.color.primary[300]};
`

const StyledAccordionHeader = styled(Accordion.Header)`
	background-color: ${(props) => props.theme.color.primary[100]};
	border-radius: 8px;

	img {
		height: 32px;
		margin-right: 0.75rem;
		vertical-align: middle;
	}

	> button {
		background-color: ${(props) => props.theme.color.primary[100]};
		color: ${(props) => props.theme.color.text[100]};
		padding: 1.25rem;

		&:hover,
		&:focus,
		&:active,
		&:not(.collapsed) {
			background-color: ${(props) => props.theme.color.primary[200]};
			color: ${(props) => props.theme.color.text[100]};
			box-shadow: none;
			border-top-left-radius: 8px;
			border-top-right-radius: 8px;
			border-bottom-left-radius: 0px;
			border-bottom-right-radius: 0px;
		}

		&:not(.collapsed) {
			transition: none;

			&:focus,
			&:active {
				border-color: ${(props) => props.theme.color.primary[300]};
			}

			::after {
				background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='${(
					props,
				) =>
					props.theme.color.text[100].replace(
						'#',
						'%23',
					)}'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
			}
		}

		::after {
			// don't turn arrow blue
			background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='${(
				props,
			) =>
				props.theme.color.text[100].replace(
					'#',
					'%23',
				)}'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
		}

		.row > .col {
			margin: auto 0;
			text-align: right;

			&:first-child {
				text-align: left;
			}

			&:last-child {
				margin-right: 25px;
			}
		}
	}
`
