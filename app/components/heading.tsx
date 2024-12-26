import {type PropsWithChildren, memo, useMemo} from 'react';

import {cn} from '@nextui-org/react';

type THeadingClassName = Pick<HTMLHeadingElementAttributes, 'className'>['className'];
type TSpanClassName = Pick<HTMLSpanElementAttributes, 'className'>['className'];

interface IProps {
	as?: 'h1' | 'h2' | 'h3';
	className?: THeadingClassName;
	classNames?: Partial<{
		title: THeadingClassName;
		subTitle: TSpanClassName;
	}>;
	isFirst?: boolean;
	subTitle?: ReactNodeWithoutBoolean;
}

export default memo<PropsWithChildren<IProps>>(function Heading({
	as: Component = 'h1',
	children,
	className,
	classNames,
	isFirst,
	subTitle,
}) {
	const headingClassName = useMemo(() => {
		switch (Component) {
			case 'h1':
				return cn('mb-4 text-2xl font-bold', !isFirst && 'mt-8', className, classNames?.title);
			case 'h2':
				return cn('mb-3 text-xl font-semibold', !isFirst && 'mt-6', className, classNames?.title);
			case 'h3':
				return cn('mb-3 text-large font-medium', !isFirst && 'mt-4', className, classNames?.title);
		}
	}, [Component, className, classNames?.title, isFirst]);

	const subTitleClassName = useMemo(() => {
		switch (Component) {
			case 'h1':
				return cn('-mt-4 mb-4 block text-foreground-500', classNames?.subTitle);
			case 'h2':
			case 'h3':
				return cn('-mt-3 mb-3 block text-small text-foreground-500', classNames?.subTitle);
		}
	}, [Component, classNames?.subTitle]);

	return (
		<>
			<Component className={headingClassName}>{children}</Component>
			{subTitle !== undefined && <span className={subTitleClassName}>{subTitle}</span>}
		</>
	);
});
