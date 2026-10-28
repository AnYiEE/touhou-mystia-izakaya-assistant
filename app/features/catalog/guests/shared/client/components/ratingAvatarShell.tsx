import { cn } from '@heroui/theme';
import { type ReactElement, type ReactNode, memo } from 'react';

import Popover, {
	type IPopoverProps,
	PopoverContent,
} from '@/design/ui/components/popover';
import Tooltip, { type ITooltipProps } from '@/design/ui/components/tooltip';

interface IProps {
	color?: IPopoverProps['color'];
	content: ReactNode;
	contentClassName?: string;
	containerPadding?: number;
	onPopoverOpen?: () => void;
	placement?: IPopoverProps['placement'];
	popoverOffset?: IPopoverProps['offset'];
	popoverProps?: Partial<IPopoverProps>;
	shouldFlip?: boolean;
	tooltipOffset?: ITooltipProps['offset'];
	trigger: ReactElement;
}

export default memo<IProps>(function RatingAvatarShell({
	color,
	containerPadding,
	content,
	contentClassName,
	onPopoverOpen,
	placement,
	popoverOffset,
	popoverProps,
	shouldFlip,
	tooltipOffset,
	trigger,
}) {
	const resolvedPopoverProps = {
		...(placement === undefined ? {} : { placement }),
		...(popoverOffset === undefined ? {} : { offset: popoverOffset }),
		...(shouldFlip === undefined ? {} : { shouldFlip }),
		...popoverProps,
		onOpenChange: (isOpen: boolean) => {
			popoverProps?.onOpenChange?.(isOpen);
			if (isOpen) {
				onPopoverOpen?.();
			}
		},
	};
	const tooltipProps = {
		...(placement === undefined ? {} : { placement }),
		...(shouldFlip === undefined ? {} : { shouldFlip }),
		...(tooltipOffset === undefined ? {} : { offset: tooltipOffset }),
	};
	const surfaceProps = {
		...(containerPadding === undefined ? {} : { containerPadding }),
		...(contentClassName === undefined
			? {}
			: { classNames: { content: cn(contentClassName) } }),
	};

	return (
		<Popover
			showArrow
			color={color}
			{...surfaceProps}
			{...resolvedPopoverProps}
		>
			<Tooltip
				showArrow
				color={color}
				content={content}
				{...surfaceProps}
				{...tooltipProps}
			>
				{trigger}
			</Tooltip>
			<PopoverContent>{content}</PopoverContent>
		</Popover>
	);
});
