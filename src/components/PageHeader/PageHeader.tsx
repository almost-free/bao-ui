import React from 'react'
import styled from 'styled-components'
import Container from '../Container'

interface PageHeaderProps {
	icon: any
	subtitle?: string
	title?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, subtitle, title }) => {
	return (
		<Container size="sm">
			<StyledPageHeader>
				<StyledTitle>{title}</StyledTitle>
				<p>{subtitle}</p>
			</StyledPageHeader>
		</Container>
	)
}

const StyledPageHeader = styled.div`
	align-items: center;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	padding-bottom: ${(props) => props.theme.spacing[6]}px;
	margin: ${(props) => props.theme.spacing[6]}px auto 0;
`

export const StyledTitle = styled.h1`
	font-family: 'Kaushan Script', sans-serif;
	font-size: 4rem !important;
	letter-spacing: -0.1rem;
	text-align: center;
	font-weight: ${(props) => props.theme.fontWeight.strong} !important;
	color: ${(props) => props.theme.color.text[100]};

	@media (max-width: ${(props) => props.theme.breakpoints.mobile}px) {
		font-size: 2.5rem !important;
	}

	@keyframes bounce {
		to {
			background-position: 300%;
		}
	}
`

export default PageHeader
