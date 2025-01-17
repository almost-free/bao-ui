import BigNumber from 'bignumber.js'
import React from 'react'
import styled from 'styled-components'
import BasketInput, { InputProps } from '../BasketInput'

interface BasketTokenInputProps extends InputProps {
	symbol: string
	_inputToken?: string
	value: string
	setValue?: Function
	onChange: (e: React.FormEvent<HTMLInputElement>) => void
	wethBalance?: BigNumber
}

const BasketTokenInput: React.FC<BasketTokenInputProps> = ({
	symbol,
	onChange,
	value,
	setValue,
	_inputToken,
	wethBalance,
}) => {
	return (
		<StyledTokenInput>
			<BasketInput
				startAdornment={
					<StyledTokenAdornmentWrapper>
						<StyledTokenSymbol>WITH</StyledTokenSymbol>
						<StyledSpacer />
					</StyledTokenAdornmentWrapper>
				}
				endAdornment={
					<StyledTokenAdornmentWrapper>
						<StyledTokenSymbol>{symbol}</StyledTokenSymbol>
					</StyledTokenAdornmentWrapper>
				}
				value={value}
				setValue={setValue}
				onChange={onChange}
				wethBalance={wethBalance}
			/>
		</StyledTokenInput>
	)
}

/*
			<div>
			  <Button size="sm" text="Max" />
			</div>
*/

const StyledTokenInput = styled.div``

const StyledSpacer = styled.div`
	width: ${(props) => props.theme.spacing[3]}px;
`

const StyledTokenAdornmentWrapper = styled.div`
	align-items: center;
	display: flex;
`

const StyledTokenSymbol = styled.span`
	color: ${(props) => props.theme.color.text[100]};
	font-weight: ${(props) => props.theme.fontWeight.medium};
`

export default BasketTokenInput
