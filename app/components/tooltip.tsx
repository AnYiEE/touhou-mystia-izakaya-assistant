'use client';

import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Tooltip as NextUITooltip, type TooltipProps} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends TooltipProps {}

export default memo<IProps>(function Tooltip({classNames, color, showArrow, ...props}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<NextUITooltip
			color={color}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			motionProps={
				isHighAppearance
					? {
							initial: {},
						}
					: {}
			}
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
