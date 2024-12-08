import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function Placeholder({children, className}) {
	return (
		<div
			className={twMerge(
				'my-auto flex select-none flex-col items-center justify-center space-y-1 text-center font-semibold leading-none text-default-200 dark:text-default-300',
				className
			)}
		>
			{children}
		</div>
	);
});
