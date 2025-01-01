'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {type ButtonProps, Button as NextUIButton, cn} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends ButtonProps {
	highAppearance?: boolean;
}

export default memo(
	forwardRef<ElementRef<typeof NextUIButton>, IProps>(function Button({className, highAppearance, ...props}, ref) {
		const enableHighAppearance = store.persistence.highAppearance.use();

		return (
			<NextUIButton
				className={cn(enableHighAppearance && highAppearance && 'backdrop-blur', className)}
				{...props}
				ref={ref}
			/>
		);
	})
);
