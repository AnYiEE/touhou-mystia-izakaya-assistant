import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function SideButtonGroup({children, className}) {
	return (
		<div className="absolute">
			<div className={twMerge('fixed bottom-6 right-6 z-20 h-min w-min', className)}>
				<div className="space-y-3">{children}</div>
			</div>
		</div>
	);
});
