import {type PropsWithChildren, forwardRef, memo} from 'react';
import clsx from 'clsx';

interface IProps {
	className?: string;
}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function Placeholder({className, children}, ref) {
		return (
			<div
				className={clsx('my-auto select-none text-center font-semibold text-default-300', className)}
				ref={ref}
			>
				{children}
			</div>
		);
	})
);
