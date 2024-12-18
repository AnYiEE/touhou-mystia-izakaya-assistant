import {type PropsWithChildren, memo, useMemo} from 'react';

import {cn} from '@nextui-org/react';

type THeadingClassName = Pick<HTMLHeadingElementAttributes, 'className'>;

interface IProps extends THeadingClassName {
	as?: 'h1' | 'h2' | 'h3';
	classNames?: Partial<{
		title: THeadingClassName['className'];
		subTitle: HTMLSpanElementAttributes['className'];
	}>;
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
}

export default memo<PropsWithChildren<IProps>>(function Heading({
	as,
	children,
	className,
	classNames,
	isFirst,
	subTitle,
}) {
	const Component = as ?? 'h1';

	const headingClassName = useMemo(() => {
		switch (Component) {
			case 'h1':
				return cn('mb-4 text-2xl font-bold', !isFirst && 'mt-8', className, classNames?.title);
			case 'h2':
				return cn('mb-3 text-xl font-semibold', !isFirst && 'mt-6', className, classNames?.title);
			case 'h3':
				return cn('mb-3 text-lg font-medium', !isFirst && 'mt-4', className, classNames?.title);
		}
	}, [Component, className, classNames?.title, isFirst]);

	const subTitleClassName = useMemo(() => {
		switch (Component) {
			case 'h1':
				return cn('-mt-4 mb-4 block text-foreground-500', classNames?.subTitle);
			case 'h2':
			case 'h3':
				return cn('-mt-3 mb-3 block text-sm text-foreground-500', classNames?.subTitle);
		}
	}, [Component, classNames?.subTitle]);

	return (
		<>
			<Component className={headingClassName}>{children}</Component>
			{subTitle !== undefined && <span className={subTitleClassName}>{subTitle}</span>}
		</>
	);
});
