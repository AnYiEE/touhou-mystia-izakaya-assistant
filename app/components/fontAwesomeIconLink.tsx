import clsx from 'clsx';

import {Link} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps {
	ariaLabel?: string;
	href?: string;
	icon: FontAwesomeIconProps['icon'];
	size?: FontAwesomeIconProps['size'];
	isExternal?: boolean;
	className?: string;
}

export default function FontAwesomeIconLink({
	ariaLabel = '',
	href = '',
	icon,
	size = '1x',
	isExternal = true,
	className = '',
}: IProps) {
	return (
		<Link
			aria-label={ariaLabel}
			href={href}
			isExternal={isExternal}
			className={clsx('text-default-500', className)}
		>
			<FontAwesomeIcon icon={icon} size={size} />
		</Link>
	);
}
