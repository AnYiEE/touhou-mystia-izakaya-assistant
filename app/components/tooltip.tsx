'use client';

import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Tooltip as NextUITooltip, type TooltipProps} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends TooltipProps {}

export default memo<IProps>(function Tooltip({classNames, color, showArrow, ...props}) {
	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return (
		<NextUITooltip
			color={color}
			showArrow={isShowBackgroundImage ? false : Boolean(showArrow)}
			motionProps={
				isShowBackgroundImage
					? {
							initial: {},
						}
					: {}
			}
			classNames={{
				...classNames,
				content: twMerge(
					isShowBackgroundImage && !color && 'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
