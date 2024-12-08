'use client';

import {type ElementRef, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import Link, {type ILinkProps} from '@/components/link';

interface IProps extends Omit<ILinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo(
	forwardRef<ElementRef<typeof Link>, IProps>(function FontAwesomeIconLink(
		{className, icon, size = '1x', ...props},
		ref
	) {
		return (
			<Link className={twMerge('text-default-400', className)} {...props} ref={ref}>
				<FontAwesomeIcon icon={icon} size={size} />
			</Link>
		);
	})
);

export type {IProps as IFontAwesomeIconLinkProps};
