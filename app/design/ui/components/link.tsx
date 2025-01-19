'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useReducedMotion} from '@/design/ui/hooks';

import {Link as HeroUILink, type LinkProps} from '@heroui/link';
import {type InternalForwardRefRenderFunction} from '@heroui/system';

import {cn} from '@/design/ui/utils';

interface IProps extends Omit<LinkProps, 'referrerPolicy'> {
	animationUnderline?: boolean;
	classNames?: Partial<{
		base: LinkProps['className'];
		underline: LinkProps['className'];
	}>;
	forcedUnderline?: boolean;
}

export default memo(
	forwardRef<ElementRef<typeof HeroUILink>, IProps>(function Link(
		{
			animationUnderline = true,
			children,
			className,
			classNames,
			disableAnimation,
			forcedUnderline,
			showAnchorIcon,
			...props
		},
		ref
	) {
		const isReducedMotion = useReducedMotion();

		return (
			<HeroUILink
				disableAnimation={disableAnimation ?? isReducedMotion}
				referrerPolicy="same-origin"
				showAnchorIcon={Boolean(showAnchorIcon)}
				className={cn(
					!disableAnimation && [
						'hover:opacity-100 active:opacity-100',
						'motion-reduce:transition-none',
						'transition hover:brightness-95',
					],
					{
						'group relative transition motion-reduce:transition-none': animationUnderline,
					},
					className,
					classNames?.base
				)}
				{...props}
				ref={ref}
			>
				{children}
				{animationUnderline && (
					<span
						className={cn(
							'absolute bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 rounded-small bg-current transition-width group-hover:w-full motion-reduce:transition-none',
							{
								'h-0.5': !showAnchorIcon,
								'w-full': forcedUnderline,
							},
							classNames?.underline
						)}
					/>
				)}
			</HeroUILink>
		);
	})
) as InternalForwardRefRenderFunction<'a', IProps>;

export type {IProps as ILinkProps};
