import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function TagGroup({className, children}, ref) {
		return (
			<div className={twMerge('flex flex-wrap gap-2', className)} ref={ref}>
				{children}
			</div>
		);
	})
);
