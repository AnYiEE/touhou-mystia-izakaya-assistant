import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function Placeholder({className, children}, ref) {
		return (
			<div
				className={twMerge('my-auto select-none text-center font-semibold text-default-300', className)}
				ref={ref}
			>
				{children}
			</div>
		);
	})
);
