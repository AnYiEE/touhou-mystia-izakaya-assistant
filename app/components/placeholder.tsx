import {type HTMLAttributes, type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function Placeholder({children, className}) {
	return (
		<div
			className={twMerge(
				'my-auto select-none text-center font-semibold text-default-200 dark:text-default-300',
				className
			)}
		>
			{children}
		</div>
	);
});
