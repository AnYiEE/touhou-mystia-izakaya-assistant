'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {type InternalForwardRefRenderFunction, type LinkProps, Link as NextUILink} from '@nextui-org/react';

import {cn} from '@/design/ui/utils';

interface IProps extends Omit<LinkProps, 'referrerPolicy'> {}

export default memo(
	forwardRef<ElementRef<typeof NextUILink>, IProps>(function Link({className, disableAnimation, ...props}, ref) {
		return (
			<NextUILink
				disableAnimation={disableAnimation}
				referrerPolicy="same-origin"
				className={cn(
					!disableAnimation && [
						'hover:opacity-100 active:opacity-100',
						'motion-reduce:transition-none',
						'transition hover:brightness-95',
					],
					className
				)}
				{...props}
				ref={ref}
			/>
		);
	})
) as InternalForwardRefRenderFunction<'a', IProps>;

export type {IProps as ILinkProps};
