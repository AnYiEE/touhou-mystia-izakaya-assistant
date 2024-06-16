import {forwardRef} from 'react';
import clsx from 'clsx';

import {Link, type LinkProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps extends Omit<LinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default forwardRef<HTMLAnchorElement | null, IProps>(function FontAwesomeIconLink(
	{icon, size = '1x', className, ...props},
	ref
) {
	return (
		<Link className={clsx('text-default-500', className)} {...props} ref={ref}>
			<FontAwesomeIcon icon={icon} size={size} />
		</Link>
	);
});
