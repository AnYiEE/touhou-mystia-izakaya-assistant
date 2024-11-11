import {type ElementRef, type HTMLAttributes, type PropsWithChildren, forwardRef, memo} from 'react';
import {twMerge} from 'tailwind-merge';

type THeadingClassName = Pick<HTMLAttributes<HTMLHeadingElement>, 'className'>;

interface IProps extends THeadingClassName {
	classNames?: Partial<{
		title: THeadingClassName['className'];
		subTitle: HTMLAttributes<HTMLSpanElement>['className'];
	}>;
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
}

export default memo(
	forwardRef<ElementRef<'h1'>, PropsWithChildren<IProps>>(function H1(
		{children, className, classNames, isFirst, subTitle},
		ref
	) {
		return (
			<>
				<h1
					className={twMerge('mb-4 text-2xl font-bold', !isFirst && 'mt-8', className, classNames?.title)}
					ref={ref}
				>
					{children}
				</h1>
				{subTitle !== undefined && (
					<span className={twMerge('-mt-4 mb-4 block text-foreground-500', classNames?.subTitle)}>
						{subTitle}
					</span>
				)}
			</>
		);
	})
);
