import { type ReactElement, type ReactNode, memo } from 'react';
import { cn } from '@heroui/theme';

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
