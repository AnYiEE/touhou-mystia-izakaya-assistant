import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLDivElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function TagGroup({children, className}) {
	return <div className={twMerge('flex flex-wrap gap-2', className)}>{children}</div>;
});
