import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import clsx from 'clsx/lite';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function TagGroup({className, children}, ref) {
		return (
			<div className={clsx('flex flex-wrap gap-2', className)} ref={ref}>
				{children}
			</div>
		);
	})
);
