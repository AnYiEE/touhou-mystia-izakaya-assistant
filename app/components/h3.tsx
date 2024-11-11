import {type HTMLAttributes, type PropsWithChildren, memo} from 'react';
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

export default memo<PropsWithChildren<IProps>>(function H3({children, className, classNames, isFirst, subTitle}) {
	return (
		<>
			<h3 className={twMerge('mb-3 text-lg font-medium', !isFirst && 'mt-4', className, classNames?.title)}>
				{children}
			</h3>
			{subTitle !== undefined && (
				<span className={twMerge('-mt-3 mb-3 block text-sm text-foreground-500', classNames?.subTitle)}>
					{subTitle}
				</span>
			)}
		</>
	);
});
