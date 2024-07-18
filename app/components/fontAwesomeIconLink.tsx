import {forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Link, type LinkProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps extends Omit<LinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<HTMLAnchorElement | null, IProps>(function FontAwesomeIconLink(
		{icon, size = '1x', className, ...props},
		ref
	) {
		return (
			<Link className={twMerge('text-default-500', className)} {...props} ref={ref}>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);
