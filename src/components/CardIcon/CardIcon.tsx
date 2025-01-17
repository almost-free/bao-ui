import React from 'react'
import styled from 'styled-components'

interface CardIconProps {
	children?: React.ReactNode
}

const CardIcon: React.FC<CardIconProps> = ({ children }) => (
	<StyledCardIcon>{children}</StyledCardIcon>
)

const StyledCardIcon = styled.div`
	font-size: 2rem;
	height: 80px;
	width: 80px;
	border-radius: 40px;
	align-items: center;
	display: flex;
	justify-content: center;
	margin: 0 auto ${(props) => props.theme.spacing[3]}px;
	background-color: ${(props) => props.theme.color.primary[200]};
`

export default CardIcon
