import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLHeadingElement>, 'className'> {
	isFirst?: boolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H3({className, isFirst, children}, ref) {
		return (
			<h3 className={twMerge('mb-3 text-lg font-medium', !isFirst && 'mt-4', className)} ref={ref}>
				{children}
			</h3>
		);
	})
);
