'use client';

import {type ComponentProps, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {useMotionProps} from '@/hooks';

import {Popover as NextUIPopover, extendVariants} from '@nextui-org/react';

import {generateRatingColor} from '@/components/avatar';
import {ratingStyleMap} from '@/components/tooltip';

import {globalStore as store} from '@/stores';

const CustomNextUIPopover = extendVariants(NextUIPopover, generateRatingColor('content', ratingStyleMap));

interface IProps extends ComponentProps<typeof CustomNextUIPopover> {}

export default memo<IProps>(function Popover({
	classNames,
	color,
	offset,
	shouldBlockScroll,
	shouldCloseOnScroll,
	showArrow,
	size,
	...props
}) {
	const motionProps = useMotionProps('popover');

	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<CustomNextUIPopover
			color={color}
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
			motionProps={motionProps}
			classNames={{
				...classNames,
				content: twMerge(
					isHighAppearance && color === undefined && 'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
