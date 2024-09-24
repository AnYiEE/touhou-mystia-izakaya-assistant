import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Popover as NextUIPopover, type PopoverProps} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends PopoverProps {}

export default memo<IProps>(function Popover({classNames, color, offset, showArrow, ...props}) {
	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return (
		<NextUIPopover
			color={color}
			offset={isShowBackgroundImage && typeof offset === 'number' ? offset - 2 : (offset as number)}
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
					isShowBackgroundImage &&
						color === undefined &&
						'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
