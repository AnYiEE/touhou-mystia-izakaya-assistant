'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useMotionProps} from '@/design/ui/hooks';

import {type DropdownProps, Dropdown as NextUIDropdown} from '@nextui-org/react';

import {cn} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

interface IProps extends DropdownProps {}

type Ref = NonNullable<DropdownProps['ref']>;

export default memo(
	forwardRef<ElementRef<typeof NextUIDropdown>, IProps>(function Dropdown(
		{classNames, shouldBlockScroll, shouldCloseOnScroll, showArrow, ...props},
		ref
	) {
		const motionProps = useMotionProps('popover');

		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<NextUIDropdown
				motionProps={motionProps}
				shouldBlockScroll={Boolean(shouldBlockScroll)}
				shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
				showArrow={isHighAppearance ? false : Boolean(showArrow)}
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
				ref={ref as Ref}
			/>
		);
	})
) as typeof NextUIDropdown;

export type {IProps as IDropdownProps};

export {DropdownItem, DropdownMenu, DropdownTrigger} from '@nextui-org/react';
export type {DropdownItemProps, DropdownMenuProps, DropdownTriggerProps} from '@nextui-org/react';
