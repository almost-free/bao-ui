import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { fetchCalcToBasket, getRecipeContract } from 'bao/utils'
import BigNumber from 'bignumber.js'
import { Button } from 'components/Button'
import { SpinnerLoader } from 'components/Loader'
import Modal, { ModalProps } from 'components/Modal'
import ModalActions from 'components/ModalActions'
import ModalContent from 'components/ModalContent'
import ModalTitle from 'components/ModalTitle'
import BasketTokenInput from 'components/BasketTokenInput'
import BasketTokenOutput from 'components/BasketTokenOutput'
import Spacer from 'components/Spacer'
import useBao from 'hooks/useBao'
import useAllowancev2 from '../../../hooks/useAllowancev2'
import useApprovev2 from '../../../hooks/useApprovev2'
import useBasketIssue from 'hooks/useBasketIssue'
import useBasketRate from 'hooks/useBasketRate'
import useTokenBalance from 'hooks/useTokenBalance'
import React, { useCallback, useMemo, useState } from 'react'
import { getDisplayBalance } from 'utils/numberFormat'
import { Contract } from 'web3-eth-contract'
import Config from '../../../bao/lib/config'
import { CloseButton, Disclaimer, HidePrice } from './styles'

interface IssueModalProps extends ModalProps {
	basketAddress: string
	basketContract: Contract
	basketName: string
	inputTokenContract: Contract
	inputTokenName: string
	outputTokenContract: Contract
	_inputToken?: string
	_outputToken?: string
	nav: { nav: BigNumber; mainnetNav: BigNumber }
}

const IssueModal: React.FC<IssueModalProps> = ({
	onDismiss,
	basketName,
	basketAddress,
	inputTokenName,
	_inputToken,
	_outputToken,
	inputTokenContract,
	nav,
}) => {
	const [basketAmount, setBasketAmount] = useState('')
	const [wethNeeded, setWethNeeded] = useState('')
	const [pendingTx, setPendingTx] = useState(false)
	const [confNo, setConfNo] = useState<number | undefined>()
	const [requestedApproval, setRequestedApproval] = useState(false)

	const navDifferenceTooHigh = useMemo(
		() =>
			nav &&
				nav.nav
					.minus(nav.mainnetNav)
					.div(nav.nav)
					.times(100)
					.abs()
					.gt(5),
		[nav],
	)

	const fetchRate = async () => {
		return fetchCalcToBasket(recipeContract, _outputToken, '1')
	}

	const handleOutputChange = useCallback(
		(e) => {
			const updateInput = (inputAmount: string) => {
				fetchRate().then((val) =>
					setWethNeeded(val.times(inputAmount).times(1.05).toFixed(18)),
				)
			}

			if (typeof e === 'string') {
				return updateInput(e)
			}

			const inputAmount = e.currentTarget.value

			if (inputAmount.length === 0) {
				setBasketAmount('')
				setWethNeeded('')
				return
			}
			if (
				isNaN(parseFloat(inputAmount)) ||
				(inputAmount.slice(-1) !== '.' && !/(\d*\.)?\d+$/.test(inputAmount)) ||
				(inputAmount.slice(-1) === '.' &&
					inputAmount.slice(0, inputAmount.length - 1).includes('.'))
			)
				return

			setBasketAmount(inputAmount)
			updateInput(inputAmount)
		},
		[setBasketAmount],
	)

	const handleInputChange = useCallback(
		(e) => {
			const updateInput = (inputAmount: string) => {
				fetchRate().then((val: BigNumber) =>
					setBasketAmount(new BigNumber(inputAmount).div(val).toFixed(18)),
				)
			}

			if (typeof e === 'string') {
				return updateInput(e)
			}

			const inputAmount = e.currentTarget.value

			if (e.currentTarget.value.length === 0) {
				setBasketAmount('')
				setWethNeeded('')
				return
			}
			if (
				isNaN(parseFloat(inputAmount)) ||
				(inputAmount.slice(-1) !== '.' && !/(\d*\.)?\d+$/.test(inputAmount)) ||
				(inputAmount.slice(-1) === '.' &&
					inputAmount.slice(0, inputAmount.length - 1).includes('.'))
			)
				return

			setWethNeeded(inputAmount)
			updateInput(inputAmount)
		},
		[setWethNeeded],
	)

	const bao = useBao()
	const issueAllowance = useAllowancev2(
		Config.addressMap.WETH,
		bao.getContract('recipe').options.address,
		pendingTx
	)
	const { onApprove: onApproveIssue } = useApprovev2(
		bao.getNewContract('erc20.json', Config.addressMap.WETH),
		bao.getContract('recipe'),
	)
	const { wethPerIndex } = useBasketRate(basketAddress)
	const recipeContract = getRecipeContract(bao)
	const { onIssue } = useBasketIssue(basketAddress)
	const wethBalance = useTokenBalance(Config.addressMap.WETH)

	return (
		<Modal>
			<CloseButton onClick={onDismiss}>
				<FontAwesomeIcon icon="window-close" />
			</CloseButton>
			<ModalTitle text={`Issue ${basketName}`} />
			<ModalContent>
				<Disclaimer>
					<p>
						{navDifferenceTooHigh
							? `The difference between NAV on mainnet ($${getDisplayBalance(
								nav.mainnetNav,
								0,
							)}) and NAV on MATIC ($${getDisplayBalance(
								nav.nav,
								0,
							)}) is greater than 5%. Minting from the UI is disabled until underlying asset prices are arbitraged within the 5% range in order to prevent loss of funds.`
							: ''}
					</p>
					<p>
						Bao uses your wETH to buy the underlying assets for you from
						SushiSwap. Minting transactions send 5% more wETH to avoid
						unexpected errors like slippage, any unused WETH is returned.
					</p>
					<HidePrice>
						<b>
							Your wETH Balance:{' '}
							{(wethBalance && getDisplayBalance(wethBalance)) || (
								<SpinnerLoader />
							)}{' '}
							<FontAwesomeIcon icon={['fab', 'ethereum']} />
						</b>
						<br />
						<b>
							1 {basketName} ={' '}
							<>
								{(wethPerIndex && getDisplayBalance(wethPerIndex, 0)) || (
									<SpinnerLoader />
								)}{' '}
								<FontAwesomeIcon icon={['fab', 'ethereum']} />
							</>
						</b>
					</HidePrice>
				</Disclaimer>
			</ModalContent>
			<BasketTokenOutput
				value={basketAmount}
				onChange={handleOutputChange}
				symbol={basketName}
				_outputToken={_outputToken}
				addInput={(n: number) => {
					const result = new BigNumber(basketAmount === '' ? 0 : basketAmount).plus(
						n,
					)
					if (result.toNumber() >= 0) {
						setBasketAmount(result.toString())
						handleOutputChange(result.toString())
					}
				}}
			/>
			<Spacer />
			<BasketTokenInput
				setValue={(num: string) => {
					setWethNeeded(num)
					handleInputChange(num)
				}}
				value={wethNeeded}
				onChange={handleInputChange}
				symbol={inputTokenName}
				_inputToken={_inputToken}
				wethBalance={wethBalance}
			/>
			<ModalActions>
				<Button text="Cancel" onClick={onDismiss} />
				{issueAllowance && !issueAllowance.gt(0) ? (
					<Button
						disabled={requestedApproval}
						onClick={() => {
							setPendingTx(true)
							setRequestedApproval(true)
							onApproveIssue()
								.on('confirmation', (_confNo: any) => {
									if (_confNo < 15) {
										setConfNo(_confNo)
									} else if (_confNo >= 15) {
										setConfNo(undefined)
										setRequestedApproval(false)
										setPendingTx(false)
									}
								})
								.on('error', () => {
									setRequestedApproval(false)
									setPendingTx(false)
								})
						}}
						text={
							confNo
								? `Confirmations: ${confNo}/15`
								: pendingTx
									? 'Pending Confirmation'
									: `Approve wETH`
						}
					/>
				) : (
					<Button
						disabled={
							pendingTx ||
							wethNeeded.slice(-1) === '.' ||
							basketAmount.slice(-1) === '.' ||
							isNaN(parseFloat(wethNeeded)) ||
							isNaN(parseFloat(basketAmount)) ||
							parseFloat(wethNeeded) === 0 ||
							parseFloat(wethNeeded) < 0 ||
							parseFloat(wethNeeded) > wethBalance.div(10 ** 18).toNumber() ||
							!nav ||
							navDifferenceTooHigh
						}
						text={
							confNo
								? `Confirmations: ${confNo}/15`
								: pendingTx
									? 'Pending Confirmation'
									: 'Confirm'
						}
						onClick={async () => {
							setPendingTx(true)
							const encodedAmountData = await recipeContract.methods
								.encodeData(
									new BigNumber(basketAmount).times(10 ** 18).toString(),
								)
								.call()
							onIssue(new BigNumber(wethNeeded), encodedAmountData)
								.on('confirmation', (_confNo: any) => {
									setConfNo(_confNo)
									if (_confNo >= 15) {
										setConfNo(undefined)
										setPendingTx(false)
										onDismiss()
										window.location.reload()
									}
								})
								.on('error', () => {
									setConfNo(undefined)
									setPendingTx(false)
								})
						}}
					/>
				)}
			</ModalActions>
		</Modal>
	)
}

export default IssueModal
