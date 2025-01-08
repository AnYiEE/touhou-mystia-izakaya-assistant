import {type PropsWithChildren, memo} from 'react';

import {cn} from '@/design/ui/components';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function TagGroup({children, className}) {
	return <div className={cn('flex flex-wrap gap-2', className)}>{children}</div>;
});
