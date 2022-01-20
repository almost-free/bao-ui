import { Button } from 'components/Button'
import Container from 'components/Container'
import Page from 'components/Page'
import PageHeader from 'components/PageHeader'
import Spacer from 'components/Spacer'
import WalletProviderModal from 'components/WalletProviderModal'
import useModal from 'hooks/useModal'
import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import { useWallet } from 'use-wallet'
import Config from '../../bao/lib/config'
import Farm from '../Farm'
import Balances from './components/Balances'
import FarmCards from './components/FarmCards'
import { StyledInfo } from './components/styles'
import ExternalLink from 'components/ExternalLink'
import useFarms from 'hooks/useFarms'
import { SpinnerLoader } from 'components/Loader'
import { FarmList } from './components/FarmList'

const Farms: React.FC = () => {
	const { path } = useRouteMatch()
	const { account, ethereum }: any = useWallet()
	const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)

	const farms = useFarms()

	return (
		<Switch>
			<Page>
				{account && ethereum.chainId === Config.defaultRpc.chainId ? (
					<>
						<PageHeader
							icon=""
							title="Farms"
							subtitle="Earn BAO by staking SushiSwap LP and Basket Tokens!"
						/>
						<Container>
							{/* <StyledInfo>
									❗️{' '}
									<span
										style={{
											fontWeight: 700,
											color: '${(props) => props.theme.color.red}',
										}}
									>
										Attention:
									</span>{' '}
									Be sure to read the{' '}
									<ExternalLink
										href="https://docs.bao.finance/franchises/bao"
										target="_blank"
									>
										docs
									</ExternalLink>{' '}
									before using the farms so you are familiar with protocol risks
									and fees!
								</StyledInfo> */}
							<Spacer size="md" />
							<Balances />
							<Spacer size="md" />
							<FarmList />
						</Container>
					</>
				) : (
					<div
						style={{
							alignItems: 'center',
							display: 'flex',
							flex: 1,
							justifyContent: 'center',
						}}
					>
						<Button
							onClick={onPresentWalletProviderModal}
							text="🔓 Unlock Wallet"
						/>
					</div>
				)}
			</Page>
		</Switch>
	)
}

export default Farms
