import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo, useMemo } from 'react';

import Switch, { type ISwitchProps } from '@/design/ui/components/switch';
import Tooltip from '@/design/ui/components/tooltip';

interface IProps extends Pick<
	ISwitchProps,
	'color' | 'className' | 'isDisabled' | 'title'
> {
	'aria-label': NonNullable<ISwitchProps['aria-label']>;
	isSelected: NonNullable<ISwitchProps['isSelected']>;
	onValueChange: NonNullable<ISwitchProps['onValueChange']>;
}

export default memo<PropsWithChildren<IProps>>(function SwitchItem({
	children,
	className,
	isDisabled,
	isSelected,
	onValueChange,
	title,
	...props
}) {
	const classNames = useMemo(
		() => ({
			base: cn(isDisabled && 'pointer-events-auto cursor-not-allowed'),
			endContent: 'leading-none',
			hiddenInput: cn(isDisabled && 'pointer-events-none'),
			startContent: 'leading-none',
		}),
		[isDisabled]
	);

	return (
		<div className={cn('flex items-center gap-2', className)}>
			{children !== undefined && (
				<span className="font-medium">{children}</span>
			)}
			<Tooltip
				content={title}
				isDisabled={title === undefined}
				offset={1}
				size="sm"
			>
				<Switch
					endContent={<span>关</span>}
					startContent={<span>开</span>}
					isDisabled={Boolean(isDisabled)}
					isSelected={isSelected}
					size="sm"
					onValueChange={onValueChange}
					classNames={classNames}
					{...props}
				/>
			</Tooltip>
		</div>
	);
});
