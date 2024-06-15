'use client';

import {useMounted} from '@/hooks';

import {Button, type ButtonProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps {
	color?: ButtonProps['color'];
	radius?: ButtonProps['radius'];
	size?: ButtonProps['size'];
	variant?: ButtonProps['variant'];
	isLoading?: ButtonProps['isLoading'];
	onPress?: ButtonProps['onPress'];
	icon: FontAwesomeIconProps['icon'];
	ariaLabel?: string;
	className?: string;
}

export default function FontAwesomeIconButton({
	color = 'default',
	radius = 'full',
	size = 'sm',
	variant = 'solid',
	isLoading = false,
	onPress = () => {},
	icon,
	ariaLabel = '',
	className = '',
}: IProps) {
	const isMounted = useMounted();

	return (
		<Button
			isIconOnly
			isLoading={!isMounted && !isLoading}
			color={color}
			radius={radius}
			size={size}
			variant={variant}
			onPress={onPress}
			aria-label={ariaLabel}
			className={className}
		>
			<FontAwesomeIcon icon={icon} size="lg" />
		</Button>
	);
}

export type {IProps as IFontAwesomeIconButtonProps};
