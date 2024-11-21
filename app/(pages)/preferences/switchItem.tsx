import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Switch, type SwitchProps} from '@nextui-org/react';

interface IProps {
	'aria-label': NonNullable<SwitchProps['aria-label']>;
	className?: NonNullable<SwitchProps['className']>;
	isSelected: NonNullable<SwitchProps['isSelected']>;
	onValueChange: NonNullable<SwitchProps['onValueChange']>;
}

export default memo<PropsWithChildren<IProps>>(function SwitchItem({
	children,
	className,
	isSelected,
	onValueChange,
	...props
}) {
	return (
		<div className={twMerge('flex items-center gap-2', className)}>
			<span className="font-medium">{children}</span>
			<Switch
				endContent={<span>关</span>}
				startContent={<span>开</span>}
				isSelected={isSelected}
				size="sm"
				onValueChange={onValueChange}
				classNames={{
					endContent: 'leading-none',
					startContent: 'leading-none',
					wrapper: 'bg-default-300 dark:bg-default-200',
				}}
				{...props}
			/>
		</div>
	);
});
