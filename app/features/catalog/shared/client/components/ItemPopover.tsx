'use client';

import { cn } from '@heroui/theme';
import { memo, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Popover, {
	type IPopoverProps,
	PopoverTrigger,
	type PopoverTriggerProps,
} from '@/design/ui/components/popover';

import { useItemPopoverSupportContext } from '@/features/catalog/shared/client/components/ItemPopoverSupport';
import { trackSupportCatalogDetail } from '@/features/donations/client/state/supportNudgeStore';

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
		HTMLButtonElementAttributes {
	shouldStyleExpandedState?: boolean;
	supportRecordId?: number;
}

export const ItemPopoverTrigger = memo<IItemPopoverTriggerProps>(
	function ItemPopoverTrigger({
		className,
		onClickCapture,
		onPress,
		shouldStyleExpandedState = true,
		supportRecordId,
		...props
	}) {
		const { isHighAppearance } = useDesignPreferences();
		const supportContext = useItemPopoverSupportContext();

		const handleOriginalPress = onPress as
			((event: unknown) => void) | undefined;
		const handleOriginalClickCapture = onClickCapture as
			((event: unknown) => void) | undefined;

		return (
			<span
				onClickCapture={(event: unknown) => {
					if (
						supportRecordId !== undefined &&
						supportContext?.isEnabled
					) {
						trackSupportCatalogDetail(
							supportContext.section,
							supportRecordId
						);
					}
					handleOriginalClickCapture?.(event);
				}}
				className="contents"
			>
				<PopoverTrigger
					onPress={(event: unknown) => {
						handleOriginalPress?.(event);
					}}
					className={cn(
						{
							'aria-expanded:bg-background/40 aria-expanded:opacity-100 aria-expanded:backdrop-blur dark:aria-expanded:bg-content1/40':
								isHighAppearance && shouldStyleExpandedState,
						},
						className
					)}
					{...props}
				/>
			</span>
		);
	}
);

export { PopoverContent as ItemPopoverContent } from '@/design/ui/components/popover';
