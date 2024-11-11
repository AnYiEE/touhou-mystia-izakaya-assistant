import {type ElementRef, type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<ElementRef<'div'>, PropsWithChildren<IProps>>(function TagGroup({children, className}, ref) {
		return (
			<div className={twMerge('flex flex-wrap gap-2', className)} ref={ref}>
				{children}
			</div>
		);
	})
);
