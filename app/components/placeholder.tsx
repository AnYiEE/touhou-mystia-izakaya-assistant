import { type PropsWithChildren, memo } from 'react';

import { cn } from '@/design/ui/components';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function Placeholder({
	children,
	className,
}) {
	return (
		<div
			className={cn(
				'my-auto flex select-none flex-col items-center justify-center space-y-1 text-center font-semibold leading-none text-default-400 dark:text-default',
				className
			)}
		>
			{children}
		</div>
	);
});
