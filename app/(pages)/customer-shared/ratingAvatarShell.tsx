import { type ReactElement, type ReactNode, memo } from 'react';

import {
	type IPopoverProps,
	type ITooltipProps,
	Popover,
	PopoverContent,
	Tooltip,
} from '@/design/ui/components';

interface IProps {
	color?: IPopoverProps['color'];
	content: ReactNode;
	placement?: IPopoverProps['placement'];
	popoverOffset?: IPopoverProps['offset'];
	tooltipOffset?: ITooltipProps['offset'];
	trigger: ReactElement;
}

export default memo<IProps>(function RatingAvatarShell({
	color,
	content,
	placement,
	popoverOffset,
	tooltipOffset,
	trigger,
}) {
	const popoverProps = {
		...(placement === undefined ? {} : { placement }),
		...(popoverOffset === undefined ? {} : { offset: popoverOffset }),
	};
	const tooltipProps = {
		...(placement === undefined ? {} : { placement }),
		...(tooltipOffset === undefined ? {} : { offset: tooltipOffset }),
	};

	return (
		<Popover showArrow color={color} {...popoverProps}>
			<Tooltip
				showArrow
				color={color}
				content={content}
				{...tooltipProps}
			>
				{trigger}
			</Tooltip>
			<PopoverContent>{content}</PopoverContent>
		</Popover>
	);
});
