import {type PropsWithChildren, forwardRef, memo} from 'react';

interface IProps {}

export default memo(
	forwardRef<HTMLUListElement | null, PropsWithChildren<IProps>>(function Ul({children}, ref) {
		return (
			<ul className="list-inside list-decimal space-y-2" ref={ref}>
				{children}
			</ul>
		);
	})
);
