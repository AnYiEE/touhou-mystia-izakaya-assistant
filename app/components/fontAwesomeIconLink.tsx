'use client';

import {memo} from 'react';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import {type ILinkProps, Link} from '@/design/ui/components';

interface IProps extends Omit<ILinkProps, 'size'>, Pick<FontAwesomeIconProps, 'icon' | 'size'> {}

export default memo<IProps>(function FontAwesomeIconLink({icon, size = '1x', ...props}) {
	return (
		<Link animationUnderline={false} color="foreground" {...props}>
			<FontAwesomeIcon icon={icon} size={size} />
		</Link>
	);
});

export type {IProps as IFontAwesomeIconLinkProps};
