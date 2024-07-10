import {type PropsWithChildren, forwardRef, memo} from 'react';
import clsx from 'clsx';

interface IH2Props {
	isFirst?: boolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IH2Props>>(function H1({isFirst, children}, ref) {
		return (
			<h2 className={clsx('mb-3 text-xl font-semibold', !isFirst && 'mt-6')} ref={ref}>
				{children}
			</h2>
		);
	})
);
