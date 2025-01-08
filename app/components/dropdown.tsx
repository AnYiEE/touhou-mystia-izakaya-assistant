'use client';

import {memo} from 'react';

import {useMotionProps} from '@/hooks';

import {type DropdownProps, Dropdown as NextUIDropdown} from '@nextui-org/react';

import {cn} from '@/design/ui/components';

import {globalStore as store} from '@/stores';

interface IProps extends DropdownProps {}

export default memo<IProps>(function Dropdown({
	classNames,
	shouldBlockScroll,
	shouldCloseOnScroll,
	showArrow,
	...props
}) {
	const motionProps = useMotionProps('popover');

	const isHighAppearance = store.persistence.highAppearance.use();

	return (
		<NextUIDropdown
			shouldBlockScroll={Boolean(shouldBlockScroll)}
			shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			motionProps={motionProps}
			classNames={{
				...classNames,
				content: cn(
					'min-w-min',
					{
						'bg-content1/40 backdrop-blur-lg dark:bg-content1/70': isHighAppearance,
					},
					classNames?.content
				),
			}}
			{...props}
		/>
	);
});
