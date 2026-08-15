'use client';

import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Popover, {
	type IPopoverProps,
	PopoverTrigger,
	type PopoverTriggerProps,
} from '@/design/ui/components/popover';

export const ItemPopover = memo<IPopoverProps>(function ItemPopover({
	classNames,
	...props
}) {
	const mergedClassNames = useMemo(
		() => ({ ...classNames, content: cn('relative', classNames?.content) }),
		[classNames]
	);

	return <Popover classNames={mergedClassNames} {...props} />;
});

interface IItemPopoverTriggerProps
	extends
		Omit<PopoverTriggerProps, 'className'>,
		HTMLButtonElementAttributes {}

export const ItemPopoverTrigger = memo<IItemPopoverTriggerProps>(
	function ItemPopoverTrigger({ className, ...props }) {
		const { isHighAppearance } = useDesignPreferences();

		return (
			<PopoverTrigger
				className={cn(
					{
						'aria-expanded:bg-background/40 aria-expanded:opacity-100 aria-expanded:backdrop-blur dark:aria-expanded:bg-content1/40':
							isHighAppearance,
					},
					className
				)}
				{...props}
			/>
		);
	}
);

export { PopoverContent as ItemPopoverContent } from '@/design/ui/components/popover';
