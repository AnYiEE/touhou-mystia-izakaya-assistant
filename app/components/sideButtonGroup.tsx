import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function SideButtonGroup({className, children}, ref) {
		return (
			<div className="absolute" ref={ref}>
				<div
					className={twMerge(
						'fixed bottom-6 right-6 z-20 h-min w-min md:top-1/2 md:-translate-y-1/2',
						className
					)}
				>
					<div className="space-y-3">{children}</div>
				</div>
			</div>
		);
	})
);
