import {type PropsWithChildren, forwardRef, memo} from 'react';
import {twJoin} from 'tailwind-merge';

interface IProps {
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H1({isFirst, subTitle, children}, ref) {
		return (
			<>
				<h1 className={twJoin('mb-4 text-2xl font-bold', !isFirst && 'mt-8')} ref={ref}>
					{children}
				</h1>
				{subTitle && <span className="-mt-4 mb-4 block text-foreground-500">{subTitle}</span>}
			</>
		);
	})
);
