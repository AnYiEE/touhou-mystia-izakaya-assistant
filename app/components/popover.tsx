import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Popover as NextUIPopover, type PopoverProps} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends PopoverProps {}

export default memo<IProps>(function Popover({classNames, color, offset, showArrow, ...props}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<NextUIPopover
			color={color}
			offset={isHighAppearance && typeof offset === 'number' ? offset - 2 : (offset as number)}
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
