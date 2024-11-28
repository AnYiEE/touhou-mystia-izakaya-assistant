import {type ComponentProps, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Popover as NextUIPopover, extendVariants} from '@nextui-org/react';

import {generateRatingColor} from '@/components/avatar';
import {ratingStyleMap} from '@/components/tooltip';

import {globalStore as store} from '@/stores';

const CustomNextUIPopover = extendVariants(NextUIPopover, generateRatingColor('content', ratingStyleMap));

interface IProps extends ComponentProps<typeof CustomNextUIPopover> {}

export default memo<IProps>(function Popover({classNames, color, offset, showArrow, ...props}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<CustomNextUIPopover
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
