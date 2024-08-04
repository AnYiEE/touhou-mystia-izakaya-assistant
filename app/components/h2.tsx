import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLHeadingElement>, 'className'> {
	isFirst?: boolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H2({className, isFirst, children}, ref) {
		return (
			<h2 className={twMerge('mb-3 text-xl font-semibold', !isFirst && 'mt-6', className)} ref={ref}>
				{children}
			</h2>
		);
	})
);
