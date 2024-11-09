import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLUListElement>, 'className'> {}

export default memo(
	forwardRef<HTMLUListElement | null, PropsWithChildren<IProps>>(function Ul({children, className}, ref) {
		return (
			<ul className={twMerge('list-inside list-decimal space-y-2 break-all text-justify', className)} ref={ref}>
				{children}
			</ul>
		);
	})
);
