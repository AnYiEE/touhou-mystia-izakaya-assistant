'use client';

import { type ComponentProps, memo, useMemo } from 'react';

import { useMotionProps, useReducedMotion } from '@/design/ui/hooks';

import {
	type InternalForwardRefRenderFunction,
	extendVariants,
} from '@heroui/system';
import { Tooltip as HeroUITooltip } from '@heroui/tooltip';

import { getStyleBlur } from '@/design/ui/components/popover';
import { cn, generateRatingVariants } from '@/design/ui/utils';

import { globalStore as store } from '@/stores';

const CustomHeroUITooltip = extendVariants(
	HeroUITooltip,
	generateRatingVariants('content')
);

interface IProps extends ComponentProps<typeof CustomHeroUITooltip> {
	disableBlur?: boolean;
}

export default memo<IProps>(function Tooltip({
	classNames,
	color,
	disableAnimation,
	disableBlur,
	radius,
	showArrow,
	...props
}) {
	const motionProps = useMotionProps('tooltip');
	const isReducedMotion = useReducedMotion();

	const isHighAppearance = store.persistence.highAppearance.use();

	const styleBlur = useMemo(
		() => getStyleBlur(color, disableBlur, isHighAppearance),
		[color, disableBlur, isHighAppearance]
	);

	return (
		<CustomHeroUITooltip
			color={color}
			disableAnimation={disableAnimation ?? isReducedMotion}
			motionProps={motionProps}
			// The same radius as `Popover`.
			radius={radius ?? 'lg'}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			classNames={{
				...classNames,
				content: cn(styleBlur, classNames?.content),
			}}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as ITooltipProps };
