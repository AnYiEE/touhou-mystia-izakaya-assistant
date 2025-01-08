'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {type ButtonProps, Button as NextUIButton} from '@nextui-org/react';

import {cn} from '@/design/ui/components';

import {globalStore as store} from '@/stores';

interface IProps extends ButtonProps {
	highAppearance?: boolean;
}

export default memo(
	forwardRef<ElementRef<typeof NextUIButton>, IProps>(function Button({className, highAppearance, ...props}, ref) {
		const isEnabledHighAppearance = store.persistence.highAppearance.use();

		return (
			<NextUIButton
				className={cn(
					{
						'backdrop-blur': isEnabledHighAppearance && highAppearance,
					},
					className
				)}
				{...props}
				ref={ref}
			/>
		);
	})
);

export type {IProps as IButtonProps};
