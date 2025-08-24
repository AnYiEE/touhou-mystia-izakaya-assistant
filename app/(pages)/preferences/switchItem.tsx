import { type PropsWithChildren, memo } from 'react';

import { type ISwitchProps, Switch, Tooltip, cn } from '@/design/ui/components';

interface IProps
	extends Pick<ISwitchProps, 'color' | 'className' | 'isDisabled' | 'title'> {
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
	return (
		<div className={cn('flex items-center gap-2', className)}>
			{children !== undefined && (
				<span className="font-medium">{children}</span>
			)}
			<Tooltip
				content={title}
				isDisabled={title === undefined}
				offset={2}
				size="sm"
			>
				<Switch
					endContent={<span>关</span>}
					startContent={<span>开</span>}
					isDisabled={Boolean(isDisabled)}
					isSelected={isSelected}
					size="sm"
					onValueChange={onValueChange}
					classNames={{
						base: cn(
							isDisabled &&
								'pointer-events-auto cursor-not-allowed'
						),
						endContent: 'leading-none',
						hiddenInput: cn(isDisabled && 'pointer-events-none'),
						startContent: 'leading-none',
					}}
					{...props}
				/>
			</Tooltip>
		</div>
	);
});
