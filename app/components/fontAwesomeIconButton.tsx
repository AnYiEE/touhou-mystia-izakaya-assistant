'use client';

import {memo} from 'react';

import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';

import {Button, type IButtonProps} from '@/design/ui/components';

interface IProps extends Omit<IButtonProps, 'isIconOnly'>, Pick<FontAwesomeIconProps, 'icon'> {}

export default memo<IProps>(function FontAwesomeIconButton({icon, radius = 'full', size = 'sm', ...props}) {
	return (
		<Button isIconOnly radius={radius} size={size} {...props}>
			<FontAwesomeIcon icon={icon} size="lg" />
		</Button>
	);
});

export type {IProps as IFontAwesomeIconButtonProps};
