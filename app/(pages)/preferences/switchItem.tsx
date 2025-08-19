import { type PropsWithChildren, memo } from 'react';

import { type ISwitchProps, Switch, cn } from '@/design/ui/components';

interface IProps extends Pick<ISwitchProps, 'color'> {
	'aria-label': NonNullable<ISwitchProps['aria-label']>;
	className?: NonNullable<ISwitchProps['className']>;
	isSelected: NonNullable<ISwitchProps['isSelected']>;
	onValueChange: NonNullable<ISwitchProps['onValueChange']>;
}

export default memo<PropsWithChildren<IProps>>(function SwitchItem({
	children,
	className,
	isSelected,
	onValueChange,
	...props
}) {
	return (
		<div className={cn('flex items-center gap-2', className)}>
			{children !== undefined && (
				<span className="font-medium">{children}</span>
			)}
			<Switch
				endContent={<span>关</span>}
				startContent={<span>开</span>}
				isSelected={isSelected}
				size="sm"
				onValueChange={onValueChange}
				classNames={{
					endContent: 'leading-none',
					startContent: 'leading-none',
				}}
				{...props}
			/>
		</div>
	);
});
