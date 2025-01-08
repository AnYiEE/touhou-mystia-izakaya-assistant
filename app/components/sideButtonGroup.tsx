import {type PropsWithChildren, memo} from 'react';

import {cn} from '@/design/ui/components';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function SideButtonGroup({children, className}) {
	return (
		<div className="absolute">
			<div className={cn('fixed bottom-6 right-6 z-20 h-min w-min', className)}>
				<div className="space-y-3">{children}</div>
			</div>
		</div>
	);
});
