import {forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Link, type LinkProps} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

interface IProps extends Omit<LinkProps, 'referrerPolicy' | 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<HTMLAnchorElement | null, IProps>(function FontAwesomeIconLink(
		{className, icon, size = '1x', ...linkProps},
		ref
	) {
		return (
			<Link
				className={twMerge('text-default-400', className)}
				referrerPolicy="same-origin"
				{...linkProps}
				ref={ref}
			>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);

export type {IProps as IFontAwesomeIconLinkProps};
