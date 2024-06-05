import {Link} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps {
	ariaLabel?: string;
	href?: string;
	icon: FontAwesomeIconProps['icon'];
	size?: FontAwesomeIconProps['size'];
	className?: string;
}

export default function FontAwesomeIconLink({ariaLabel = '', href = '', icon, size = '1x', className = ''}: IProps) {
	return (
		<Link isExternal aria-label={ariaLabel} className={className} href={href}>
			<FontAwesomeIcon icon={icon} size={size} />
		</Link>
	);
}
