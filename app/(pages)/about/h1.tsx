import {type PropsWithChildren, forwardRef, memo} from 'react';
import clsx from 'clsx';

interface IH1Props {
	isFirst?: boolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IH1Props>>(function H1({isFirst, children}, ref) {
		return (
			<h1 className={clsx('mb-4 text-2xl font-bold', !isFirst && 'mt-8')} ref={ref}>
				{children}
			</h1>
		);
	})
);
