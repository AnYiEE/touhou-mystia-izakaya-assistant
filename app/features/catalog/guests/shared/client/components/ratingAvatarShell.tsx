import { type ReactElement, type ReactNode, memo } from 'react';

import Popover, {
	type IPopoverProps,
	PopoverContent,
} from '@/design/ui/components/popover';
import Tooltip, { type ITooltipProps } from '@/design/ui/components/tooltip';

interface IProps {
	color?: IPopoverProps['color'];
	content: ReactNode;
	placement?: IPopoverProps['placement'];
	popoverOffset?: IPopoverProps['offset'];
	popoverProps?: Partial<IPopoverProps>;
	tooltipOffset?: ITooltipProps['offset'];
	trigger: ReactElement;
}

export default memo<IProps>(function RatingAvatarShell({
	color,
	content,
	placement,
	popoverOffset,
	popoverProps,
	tooltipOffset,
	trigger,
}) {
	const resolvedPopoverProps = {
		...(placement === undefined ? {} : { placement }),
		...(popoverOffset === undefined ? {} : { offset: popoverOffset }),
		...popoverProps,
	};
	const tooltipProps = {
		...(placement === undefined ? {} : { placement }),
		...(tooltipOffset === undefined ? {} : { offset: tooltipOffset }),
	};

	return (
		<Popover showArrow color={color} {...resolvedPopoverProps}>
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
