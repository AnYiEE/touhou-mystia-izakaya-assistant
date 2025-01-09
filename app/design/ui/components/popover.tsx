'use client';

import {type ComponentProps, type ElementRef, forwardRef, memo, useMemo} from 'react';

import {useMotionProps} from '@/design/ui/hooks';

import {type InternalForwardRefRenderFunction, Popover as NextUIPopover, extendVariants} from '@nextui-org/react';

import {cn, generateRatingVariants} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

export function getStyleBlur(color: IProps['color'], disableBlur = false, isHighAppearance = false) {
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

const CustomNextUIPopover = extendVariants(NextUIPopover, generateRatingVariants('content'));

interface IProps extends ComponentProps<typeof CustomNextUIPopover> {
	disableBlur?: boolean;
}

export default memo(
	forwardRef<ElementRef<typeof NextUIPopover>, IProps>(function Popover(
		{classNames, color, disableBlur, offset, shouldBlockScroll, shouldCloseOnScroll, showArrow, size, ...props},
		ref
	) {
		const motionProps = useMotionProps('popover');

		const isHighAppearance = store.persistence.highAppearance.use();

		const styleBlur = useMemo(
			() => getStyleBlur(color, disableBlur, isHighAppearance),
			[color, disableBlur, isHighAppearance]
		);

		return (
			<CustomNextUIPopover
				color={color}
				motionProps={motionProps}
				// The same offset position as `Tooltip`.
				offset={
					typeof offset === 'number'
						? offset + (isHighAppearance ? -2 : size === 'sm' && !showArrow ? -3 : showArrow ? 1 : -3)
						: (offset as unknown as number)
				}
				shouldBlockScroll={Boolean(shouldBlockScroll)}
				shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
				showArrow={isHighAppearance ? false : Boolean(showArrow)}
				size={size}
				classNames={{
					...classNames,
					content: cn(styleBlur, classNames?.content),
				}}
				{...props}
				ref={ref}
			/>
		);
	})
) as InternalForwardRefRenderFunction<'div', IProps>;

export type {IProps as IPopoverProps};

export {PopoverContent, PopoverTrigger, usePopoverContext} from '@nextui-org/react';
export type {PopoverContentProps, PopoverTriggerProps} from '@nextui-org/react';
