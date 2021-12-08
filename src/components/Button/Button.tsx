import React, { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled, { ThemeContext } from 'styled-components'

interface ButtonProps {
	children?: React.ReactNode
	disabled?: boolean
	href?: string
	onClick?: () => void
	size?: 'sm' | 'md' | 'lg'
	text?: any
	to?: string
	variant?: 'default' | 'secondary' | 'tertiary'
	inline?: boolean
	width?: string
	target?: string
	border?: boolean
}

export const Button: React.FC<ButtonProps> = ({
	children,
	disabled,
	href,
	onClick,
	size,
	text,
	to,
	variant,
	inline,
	width,
	target,
	border,
}) => {
	const { spacing } = useContext(ThemeContext)

	let buttonColor: string
	switch (variant) {
		case 'secondary':
			buttonColor = '#a29b91'
			break
		case 'default':
		default:
			buttonColor = '#50251c'
	}

	let buttonSize: number
	let buttonPadding: number
	let fontSize: string
	switch (size) {
		case 'sm':
			buttonPadding = spacing[4]
			buttonSize = 40
			fontSize = '0.75rem'
			break
		case 'lg':
			buttonPadding = spacing[4]
			buttonSize = 72
			fontSize = '1rem'
			break
		case 'md':
		default:
			buttonPadding = spacing[4]
			buttonSize = 50
			fontSize = '1rem'
	}

	const ButtonChild = useMemo(() => {
		if (to != '' && to != null) {
			return <StyledLink to={to}>{text}</StyledLink>
		} else if (href) {
			return (
				<ButtonLink href={href} target="__blank">
					{text}
				</ButtonLink>
			)
		} else {
			return text
		}
	}, [href, text, to])

	const ButtonComp = !border ? StyledButton : StyledBorderButton
	return (
		<ButtonComp
			color={buttonColor}
			disabled={disabled}
			fontSize={fontSize}
			onClick={onClick}
			padding={buttonPadding}
			size={buttonSize}
			inline={inline}
			width={width}
			target={target}
		>
			{children}
			{ButtonChild}
		</ButtonComp>
	)
}

interface StyledButtonProps {
	disabled?: boolean
	fontSize: string
	padding: number
	size: number
	inline: boolean
	width: string
	target?: string
}

const StyledButton = styled.button.attrs((attrs: StyledButtonProps) => ({
	target: attrs.target || '',
}))<StyledButtonProps>`
	align-items: center;
	background: ${(props) => props.theme.color.primary[100]};
	border-radius: ${(props) => props.theme.borderRadius}px;
	border: ${(props) => props.theme.color.primary[300]} 1px solid;
	padding: ${(props) => -props.theme.spacing[3]}px;
	color: ${(props) => props.theme.color.text[100]};
	display: ${(props) => (props.inline ? 'inline-block' : 'flex')};
	font-size: ${(props) => props.fontSize};
	font-weight: ${(props) => props.theme.fontWeight.strong};
	height: ${(props) => props.size}px;
	justify-content: center;
	outline: none;
	padding-left: ${(props) => props.padding}px;
	padding-right: ${(props) => props.padding}px;
	pointer-events: ${(props) => (!props.disabled ? undefined : 'none')};
	width: ${(props) => (props.width ? props.width : '100%')};
	opacity: ${(props) => (props.disabled ? 0.5 : 1)};
	position: relative;
	overflow: hidden;
	transition: 200ms;

	@media (max-width: 960px) {
		/* margin: 0 0.5rem 0 0.5rem; */
		text-align: center;
		padding: ${(props) => -props.theme.spacing[1]}px
			${(props) => -props.theme.spacing[3]}px;
	}
	@media (max-width: 640px) {
		width: 100%;
		padding: ${(props) => -props.theme.spacing[3]}px
			${(props) => -props.theme.spacing[3]}px;
	}

	&:hover,
	&:active {
		background-color: ${(props) => props.theme.color.primary[200]};
		color: ${(props) => props.theme.color.text[400]};
		cursor: ${(props) =>
			props.disabled ? 'not-allowed' : 'pointer'} !important;
	}
`

const StyledLink = styled(Link)`
	align-items: center;
	color: inherit;
	display: flex;
	flex: 1;
	height: 50px;
	justify-content: center;
	margin: 0 ${(props) => -props.theme.spacing[4]}px;
	padding: 0 ${(props) => props.theme.spacing[4]}px;
	text-decoration: none;

	&:hover,
	&:focus {
		color: ${(props) => props.theme.color.text[400]};
	}
`

const ButtonLink = styled.a`
	align-items: center;
	color: inherit;
	display: flex;
	flex: 1;
	height: 50px;
	justify-content: center;
	margin: 0 ${(props) => -props.theme.spacing[4]}px;
	padding: 0 ${(props) => props.theme.spacing[4]}px;
	text-decoration: none;

	&:hover,
	&:focus {
		color: ${(props) => props.theme.color.text[400]};
	}
`

export const MaxButton = styled.a`
	padding: ${(props) => props.theme.spacing[2]}px;
	color: ${(props) => props.theme.color.text[100]};
	background: ${(props) => props.theme.color.primary[100]};
	border-radius: ${(props) => props.theme.borderRadius}px;
	vertical-align: middle;
	margin-right: ${(props) => props.theme.spacing[2]}px;
	transition: 200ms;
	user-select: none;
	font-weight: ${(props) => props.theme.fontWeight.medium};
	text-decoration: none;
	border: none;
	font-weight: ${(props) => props.theme.fontWeight.strong};
	font-size: ${(props) => props.theme.fontSize.sm};

	&:hover {
		background: ${(props) => props.theme.color.primary[100]};
		color: ${(props) => props.theme.color.text[400]};
		cursor: pointer;
	}
`

export const StyledBorderButton = styled(StyledButton)`
	&:hover {
		color: ${(props) => props.theme.color.text[100]};
	}
`

type NavButtonProps = {
	onClick: (s: any) => void
	active: string
	options: string[]
}

export const NavButtons = ({ options, active, onClick }: NavButtonProps) => (
	<NavButtonWrapper>
		{options.map((option: string) => (
			<NavButton
				key={option}
				className={option === active ? 'buttonActive' : 'buttonInactive'}
				onClick={() => onClick(option)}
			>
				{option}
			</NavButton>
		))}
	</NavButtonWrapper>
)

const NavButtonWrapper = styled.div`
	display: flex;
	width: 100%;
	cursor: pointer;
`

const NavButton = styled.button`
	display: flex;
	justify-content: center;
	width: 100%;
	padding: 0.5rem;
	font-weight: ${(props) => props.theme.fontWeight.strong};
	font-size: ${(props) => props.theme.fontSize.default};
	transition: 200ms;
	height: 50px;
	align-items: center;
	vertical-align: middle;
	line-height: 1.2;
	transition-property: all;
	min-width: 2.5rem;
	padding-inline-start: 1rem;
	padding-inline-end: 1rem;
	border-radius: 8px;
	overflow: hidden;

	&:focus {
		outline: 0;
	}

	&:hover {
		background: ${(props) => props.theme.color.primary[200]};
		cursor: pointer;
	}

	&:hover,
	&:focus,
	&:active {
		cursor: ${(props) =>
			props.disabled ? 'not-allowed' : 'pointer'} !important;
	}

	&:first-child {
		margin-right: 0.5rem;
	}
`
