import {memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {type DropdownProps, Dropdown as NextUIDropdown} from '@nextui-org/react';

import {globalStore as store} from '@/stores';

interface IProps extends DropdownProps {}

export default memo<IProps>(function Dropdown({
	classNames,
	shouldBlockScroll,
	shouldCloseOnScroll,
	showArrow,
	...props
}) {
	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<NextUIDropdown
			shouldBlockScroll={Boolean(shouldBlockScroll)}
			shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
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
					'min-w-min',
					isHighAppearance && 'bg-content1/40 backdrop-blur-lg dark:bg-content1/70',
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
