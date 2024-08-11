import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

type TClassName = HTMLAttributes<HTMLHeadingElement>['className'];

interface IProps {
	className: TClassName;
	isFirst: boolean;
	subTitle: ReactNodeWithoutBoolean;
	subTitleClassName: TClassName;
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<Partial<IProps>>>(function H1(
		{className, isFirst, subTitle, subTitleClassName, children},
		ref
	) {
		return (
			<>
				<h1 className={twMerge('mb-4 text-2xl font-bold', !isFirst && 'mt-8', className)} ref={ref}>
					{children}
				</h1>
				{subTitle && (
					<span className={twMerge('-mt-4 mb-4 block text-foreground-500', subTitleClassName)}>
						{subTitle}
					</span>
				)}
			</>
		);
	})
);
