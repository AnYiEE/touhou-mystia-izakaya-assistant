import {forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Link, type LinkProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps extends Omit<LinkProps, 'referrerPolicy' | 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<HTMLAnchorElement | null, IProps>(function FontAwesomeIconLink(
		{icon, size = '1x', className, ...props},
		ref
	) {
		return (
			<Link
				className={twMerge('text-default-400 dark:text-default-500', className)}
				referrerPolicy="same-origin"
				{...props}
				ref={ref}
			>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);

export type {IProps as IFontAwesomeIconLinkProps};
