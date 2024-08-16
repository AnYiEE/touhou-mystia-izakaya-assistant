import {type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

interface IProps extends Pick<HTMLAttributes<HTMLHeadingElement>, 'className'> {
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
	subTitleClassName?: HTMLAttributes<HTMLSpanElement>['className'];
}

export default memo(
	forwardRef<HTMLHeadingElement | null, PropsWithChildren<IProps>>(function H3(
		{className, isFirst, subTitle, subTitleClassName, children},
		ref
	) {
		return (
			<>
				<h3 className={twMerge('mb-3 text-lg font-medium', !isFirst && 'mt-4', className)} ref={ref}>
					{children}
				</h3>
				{subTitle && (
					<span className={twMerge('-mt-3 mb-3 block text-sm text-foreground-500', subTitleClassName)}>
						{subTitle}
					</span>
				)}
			</>
		);
	})
);
