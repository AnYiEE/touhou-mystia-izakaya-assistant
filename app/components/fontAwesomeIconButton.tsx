import {Button, type ButtonProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps {
	color?: ButtonProps['color'];
	radius?: ButtonProps['radius'];
	size?: ButtonProps['size'];
	variant?: ButtonProps['variant'];
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
	onPress = () => {},
	icon,
	ariaLabel = '',
	className = '',
}: IProps) {
	return (
		<Button
			isIconOnly
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
