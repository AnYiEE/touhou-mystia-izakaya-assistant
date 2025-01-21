'use client';

import {type ElementRef, forwardRef, memo} from 'react';

import {useMotionProps, useReducedMotion} from '@/design/ui/hooks';

import {type DropdownProps, Dropdown as HeroUIDropdown} from '@heroui/dropdown';

import {cn} from '@/design/ui/utils';

import {globalStore as store} from '@/stores';

interface IProps extends DropdownProps {}

type Ref = NonNullable<DropdownProps['ref']>;

export default memo(
	forwardRef<ElementRef<typeof HeroUIDropdown>, IProps>(function Dropdown(
		{classNames, disableAnimation, shouldBlockScroll, shouldCloseOnScroll, showArrow, ...props},
		ref
	) {
		const motionProps = useMotionProps('popover');
		const isReducedMotion = useReducedMotion();

		const isHighAppearance = store.persistence.highAppearance.use();

		return (
			<HeroUIDropdown
				disableAnimation={disableAnimation ?? isReducedMotion}
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
) as typeof HeroUIDropdown;

export type {IProps as IDropdownProps};

export {DropdownItem, DropdownMenu, DropdownTrigger} from '@heroui/dropdown';
export type {DropdownItemProps, DropdownMenuProps, DropdownTriggerProps} from '@heroui/dropdown';
