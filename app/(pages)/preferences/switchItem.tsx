import {type PropsWithChildren, forwardRef, memo} from 'react';

import {Switch, type SwitchProps} from '@nextui-org/react';

interface IProps {
	'aria-label': NonNullable<SwitchProps['aria-label']>;
	isSelected: NonNullable<SwitchProps['isSelected']>;
	onValueChange: NonNullable<SwitchProps['onValueChange']>;
}

export default memo(
	forwardRef<HTMLInputElement | null, PropsWithChildren<IProps>>(function SwitchItem(
		{isSelected, onValueChange, children, ...props},
		ref
	) {
		return (
			<div className="flex items-center">
				<span className="font-medium">{children}</span>
				<Switch
					endContent={<span>关</span>}
					startContent={<span>开</span>}
					isSelected={isSelected}
					size="sm"
					onValueChange={onValueChange}
					className="ml-2"
					classNames={{
						endContent: 'leading-none',
						startContent: 'leading-none',
						wrapper: 'bg-default-300 dark:bg-default-200',
					}}
					{...props}
					ref={ref}
				/>
			</div>
		);
	})
);
