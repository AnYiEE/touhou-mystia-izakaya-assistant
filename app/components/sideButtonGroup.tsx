import {forwardRef, memo, type PropsWithChildren} from 'react';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, PropsWithChildren<IProps>>(function SideButtonGroup({children}, ref) {
		return (
			<div className="absolute" ref={ref}>
				<div className="fixed bottom-6 right-6 z-20 md:bottom-[calc(50%-4rem)]">
					<div className="flex flex-col gap-3">{children}</div>
				</div>
			</div>
		);
	})
);
