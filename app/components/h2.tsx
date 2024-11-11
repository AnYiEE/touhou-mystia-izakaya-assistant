import {type HTMLAttributes, type PropsWithChildren, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLHeadingElement>, 'className'> {
	isFirst?: boolean;
}

export default memo<PropsWithChildren<IProps>>(function H2({children, className, isFirst}) {
	return <h2 className={twMerge('mb-3 text-xl font-semibold', !isFirst && 'mt-6', className)}>{children}</h2>;
});
