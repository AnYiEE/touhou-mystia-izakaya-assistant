'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import Button, {type IButtonProps} from '@/components/button';

interface IProps extends Omit<IButtonProps, 'isIconOnly'>, Pick<FontAwesomeIconProps, 'icon'> {}

export default memo(
	forwardRef<ElementRef<typeof Button>, IProps>(function FontAwesomeIconButton(
		{icon, radius = 'full', size = 'sm', ...props},
		ref
	) {
		return (
			<Button isIconOnly radius={radius} size={size} {...props} ref={ref}>
				<FontAwesomeIcon icon={icon} size="lg" />
			</Button>
		);
	})
);

export type {IProps as IFontAwesomeIconButtonProps};
