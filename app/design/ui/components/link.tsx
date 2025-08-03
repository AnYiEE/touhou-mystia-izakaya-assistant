'use client';

import { memo } from 'react';

import { useReducedMotion } from '@/design/ui/hooks';

import { Link as HeroUILink, type LinkProps } from '@heroui/link';
import { type InternalForwardRefRenderFunction } from '@heroui/system';

import { cn } from '@/design/ui/utils';

interface IProps extends Omit<LinkProps, 'referrerPolicy'> {
	animationUnderline?: boolean;
	classNames?: Partial<{
		base: LinkProps['className'];
		underline: LinkProps['className'];
	}>;
	forcedUnderline?: boolean;
}

export default memo<IProps>(function Link({
	animationUnderline = true,
	children,
	className,
	classNames,
	color,
	disableAnimation,
	forcedUnderline,
	isBlock,
	showAnchorIcon,
	...props
}) {
	const isReducedMotion = useReducedMotion();

	return (
		<HeroUILink
			color={color}
			disableAnimation={disableAnimation ?? isReducedMotion}
			isBlock={isBlock}
			referrerPolicy="same-origin"
			showAnchorIcon={Boolean(showAnchorIcon)}
			className={cn(
				!isBlock && 'hover:opacity-hover',
				!disableAnimation && [
					'hover:opacity-100 active:opacity-100',
					'motion-reduce:transition-none',
					'transition hover:brightness-95',
				],
				{
					'group relative transition motion-reduce:transition-none':
						animationUnderline,
					'text-primary-600':
						color === 'primary' || color === undefined,
				},
				className,
				classNames?.base
			)}
			{...props}
		>
			{children}
			{animationUnderline && (
				<span
					className={cn(
						'absolute bottom-0.5 left-1/2 h-px w-0 -translate-x-1/2 rounded-small bg-current transition-width group-hover:w-full motion-reduce:transition-none',
						{ 'h-0.5': !showAnchorIcon, 'w-full': forcedUnderline },
						classNames?.underline
					)}
				/>
			)}
		</HeroUILink>
	);
}) as InternalForwardRefRenderFunction<'a', IProps>;

export type { IProps as ILinkProps };
