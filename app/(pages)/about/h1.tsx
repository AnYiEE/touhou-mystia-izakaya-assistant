import {type PropsWithChildren, type ReactNode, forwardRef, memo} from 'react';
import clsx from 'clsx/lite';

interface IH1Props {
	isFirst?: boolean;
	subTitle?: Exclude<ReactNode, boolean>;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IH1Props>>(function H1({isFirst, subTitle, children}, ref) {
		return (
			<>
				<h1 className={clsx('mb-4 text-2xl font-bold', !isFirst && 'mt-8')} ref={ref}>
					{children}
				</h1>
				{subTitle && <span className="-mt-4 mb-4 block text-foreground-500">{subTitle}</span>}
			</>
		);
	})
);
