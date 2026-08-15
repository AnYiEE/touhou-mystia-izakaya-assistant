'use client';

import { Popover as HeroUIPopover } from '@heroui/popover';
import {
	type InternalForwardRefRenderFunction,
	extendVariants,
} from '@heroui/system';
import { cn } from '@heroui/theme';
import { type ComponentProps, memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { createRatingVariants } from '@/design/theme/styles/rating/createRatingVariants';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

export function getStyleBlur(
	color: IProps['color'],
	disableBlur = false,
	isHighAppearance = false
) {
	if (!isHighAppearance) {
		return '';
	}

	const base = cn('backdrop-blur-lg');
	const colorDefault = cn('bg-content1/40 dark:bg-content1/70');

	if (disableBlur) {
		if (color === undefined) {
			return cn(base, colorDefault);
		}
		return '';
	}

	switch (color) {
		case undefined:
		case 'default':
			return cn(base, colorDefault);
		case 'danger':
			return cn(base, 'bg-danger/40 dark:bg-danger/70');
		case 'primary':
			return cn(base, 'bg-primary/40 dark:bg-primary/70');
		case 'secondary':
			return cn(base, 'bg-secondary/40 dark:bg-secondary/70');
		case 'success':
			return cn(base, 'bg-success/40 dark:bg-success/70');
		case 'warning':
			return cn(base, 'bg-warning/40 dark:bg-warning/70');
		default:
			return '';
	}
}

const CustomHeroUIPopover = extendVariants(
	HeroUIPopover,
	createRatingVariants('content')
);

interface IProps extends ComponentProps<typeof CustomHeroUIPopover> {
	disableBlur?: boolean;
}

export default memo<IProps>(function Popover({
	classNames,
	color,
	disableAnimation,
	disableBlur,
	offset,
	shouldBlockScroll,
	shouldCloseOnScroll,
	showArrow,
	size,
	...props
}) {
	const { isHighAppearance } = useDesignPreferences();
	const motionProps = useMotionProps('popover');
	const isReducedMotion = useReducedMotion();

	const styleBlur = useMemo(
		() => getStyleBlur(color, disableBlur, isHighAppearance),
		[color, disableBlur, isHighAppearance]
	);
	const mergedClassNames = useMemo(
		() => ({ ...classNames, content: cn(styleBlur, classNames?.content) }),
		[classNames, styleBlur]
	);

	return (
		<CustomHeroUIPopover
			color={color}
			disableAnimation={disableAnimation ?? isReducedMotion}
			motionProps={motionProps}
			// The same offset position as `Tooltip`.
			offset={
				typeof offset === 'number'
					? offset +
						(isHighAppearance
							? -2
							: size === 'sm' && !showArrow
								? -3
								: showArrow
									? 1
									: -3)
					: (offset as unknown as number)
			}
			shouldBlockScroll={Boolean(shouldBlockScroll)}
			shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			size={size}
			classNames={mergedClassNames}
			{...props}
		/>
	);
}) as InternalForwardRefRenderFunction<'div', IProps>;

export type { IProps as IPopoverProps };

export {
	PopoverContent,
	PopoverTrigger,
	usePopoverContext,
} from '@heroui/popover';
export type { PopoverContentProps, PopoverTriggerProps } from '@heroui/popover';
