import {forwardRef, memo, type PropsWithChildren} from 'react';
import clsx from 'clsx';

interface IProps {
	className?: string;
}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function TagGroup({className, children}, ref) {
		return (
			<div className={clsx('flex flex-wrap gap-2', className)} ref={ref}>
				{children}
			</div>
		);
	})
);
