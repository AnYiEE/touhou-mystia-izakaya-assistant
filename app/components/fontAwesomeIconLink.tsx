'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import {type ILinkProps, Link, cn} from '@/design/ui/components';

interface IProps extends Omit<ILinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<ElementRef<typeof Link>, IProps>(function FontAwesomeIconLink(
		{className, icon, size = '1x', ...props},
		ref
	) {
		return (
			<Link className={cn('text-foreground', className)} {...props} ref={ref}>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);

export type {IProps as IFontAwesomeIconLinkProps};
