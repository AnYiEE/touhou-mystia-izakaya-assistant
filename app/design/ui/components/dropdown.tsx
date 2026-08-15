'use client';

import {
	type DropdownProps,
	Dropdown as HeroUIDropdown,
} from '@heroui/dropdown';
import { cn } from '@heroui/theme';
import { type JSX, memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import { useMotionProps } from '@/design/ui/hooks/useMotionProps';
import { useReducedMotion } from '@/design/ui/hooks/useReducedMotion';

interface IProps extends DropdownProps {}

export default memo<IProps>(function Dropdown({
	classNames,
	disableAnimation,
	shouldBlockScroll,
	shouldCloseOnScroll,
	showArrow,
	...props
}) {
	const { isHighAppearance } = useDesignPreferences();
	const motionProps = useMotionProps('popover');
	const isReducedMotion = useReducedMotion();

	const mergedClassNames = useMemo(
		() => ({
			...classNames,
			content: cn(
				'min-w-min',
				{
					'bg-content1/40 backdrop-blur-lg dark:bg-content1/70':
						isHighAppearance,
				},
				classNames?.content
			),
		}),
		[classNames, isHighAppearance]
	);

	return (
		<HeroUIDropdown
			disableAnimation={disableAnimation ?? isReducedMotion}
			motionProps={motionProps}
			shouldBlockScroll={Boolean(shouldBlockScroll)}
			shouldCloseOnScroll={Boolean(shouldCloseOnScroll)}
			showArrow={isHighAppearance ? false : Boolean(showArrow)}
			classNames={mergedClassNames}
			{...props}
		/>
	);
}) as { (props: IProps): JSX.Element; displayName: string };

export type { IProps as IDropdownProps };

export {
	DropdownItem,
	DropdownMenu,
	DropdownSection,
	DropdownTrigger,
} from '@heroui/dropdown';
export type {
	DropdownItemProps,
	DropdownMenuProps,
	DropdownSectionProps,
	DropdownTriggerProps,
} from '@heroui/dropdown';
