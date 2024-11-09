import {Fragment, type PropsWithChildren, memo} from 'react';

interface IProps {
	showSymbol?: boolean;
}

export default memo<PropsWithChildren<IProps>>(function Price({children, showSymbol = true}) {
	const Component = showSymbol ? 'span' : Fragment;

	return (
		<Component>
			{showSymbol && <span className="mr-0.5">¥</span>}
			<span className="font-mono leading-none">{children}</span>
		</Component>
	);
});
