import {type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLUListElementAttributes, 'className'> {}

export default memo<PropsWithChildren<IProps>>(function Ul({children, className}) {
	return (
		<ul className={twMerge('list-inside list-decimal space-y-2 break-all text-justify', className)}>{children}</ul>
	);
});
