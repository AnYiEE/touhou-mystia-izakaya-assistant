import {forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import Link, {type ILinkProps} from '@/components/link';

interface IProps extends Omit<ILinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<HTMLAnchorElement | null, IProps>(function FontAwesomeIconLink(
		{className, icon, size = '1x', ...linkProps},
		ref
	) {
		return (
			<Link className={twMerge('text-default-400', className)} {...linkProps} ref={ref}>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);

export type {IProps as IFontAwesomeIconLinkProps};
