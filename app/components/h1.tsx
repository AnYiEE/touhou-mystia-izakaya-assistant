import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLHeadingElement>, 'className'> {
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
	subTitleClassName?: HTMLAttributes<HTMLSpanElement>['className'];
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H1(
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
