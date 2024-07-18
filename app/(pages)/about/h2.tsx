import {type PropsWithChildren, forwardRef, memo} from 'react';
import {twJoin} from 'tailwind-merge';

interface IProps {
	isFirst?: boolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H1({isFirst, children}, ref) {
		return (
			<h2 className={twJoin('mb-3 text-xl font-semibold', !isFirst && 'mt-6')} ref={ref}>
				{children}
			</h2>
		);
	})
);
