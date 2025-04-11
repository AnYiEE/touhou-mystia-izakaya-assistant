'use client';

import {memo} from 'react';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import {type ILinkProps, Link, cn} from '@/design/ui/components';

interface IProps extends Omit<ILinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo<IProps>(function FontAwesomeIconLink({className, icon, size = '1x', ...props}) {
	return (
		<Link animationUnderline={false} className={cn('text-foreground', className)} {...props}>
			<FontAwesomeIcon icon={icon} size={size} />
		</Link>
	);
});

export type {IProps as IFontAwesomeIconLinkProps};
