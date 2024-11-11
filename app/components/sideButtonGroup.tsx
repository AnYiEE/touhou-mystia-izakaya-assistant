import {type ElementRef, type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<ElementRef<'div'>, PropsWithChildren<IProps>>(function SideButtonGroup({children, className}, ref) {
		return (
			<div className="absolute" ref={ref}>
				<div className={twMerge('fixed bottom-6 right-6 z-20 h-min w-min', className)}>
					<div className="space-y-3">{children}</div>
				</div>
			</div>
		);
	})
);
