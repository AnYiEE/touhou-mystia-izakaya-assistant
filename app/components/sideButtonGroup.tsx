import {forwardRef, memo, type PropsWithChildren} from 'react';
import clsx from 'clsx';

interface IProps {
	className?: string;
}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function SideButtonGroup({className, children}, ref) {
		return (
			<div className="absolute" ref={ref}>
				<div className={clsx('fixed bottom-6 right-6 z-20 w-min md:bottom-[calc(50%-4.5rem)]', className)}>
					<div className="flex flex-col gap-3">{children}</div>
				</div>
			</div>
		);
	})
);
