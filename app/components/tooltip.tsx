'use client';

import {type ComponentProps, memo} from 'react';

import {useMotionProps} from '@/hooks';

import {Tooltip as NextUITooltip, cn, extendVariants} from '@nextui-org/react';

import {type TRatingStyleMap, generateRatingColor} from '@/components/avatar';

import {globalStore as store} from '@/stores';

export const ratingStyleMap = {
	bad: 'ring-bad-border bg-bad',
	exbad: 'ring-exbad-border bg-exbad',
	exgood: 'ring-exgood-border bg-exgood',
	good: 'ring-good-border bg-good',
	norm: 'ring-norm-border bg-norm',
} as const satisfies TRatingStyleMap;

const CustomNextUITooltip = extendVariants(NextUITooltip, generateRatingColor('content', ratingStyleMap));

interface IProps extends ComponentProps<typeof CustomNextUITooltip> {}

export default memo<IProps>(function Tooltip({classNames, color, radius, showArrow, ...props}) {
	const motionProps = useMotionProps('tooltip');

	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<CustomNextUITooltip
			color={color}
			// The same radius as `Popover`.
			radius={radius ?? 'lg'}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			motionProps={motionProps}
			classNames={{
				...classNames,
				content: cn(
					{
						'bg-content1/40 backdrop-blur-lg dark:bg-content1/70': isHighAppearance && color === undefined,
					},
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
