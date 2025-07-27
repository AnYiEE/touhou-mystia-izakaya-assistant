import {Fragment, type PropsWithChildren, memo} from 'react';

interface IProps {
	showSymbol?: boolean;
}

export default memo<PropsWithChildren<IProps>>(function Price({children, showSymbol = true}) {
	const Component = showSymbol ? 'span' : Fragment;

	return (
		<Component>
			{showSymbol && <span className="mr-0.5">¥</span>}
			<span className="font-mono">
				{Array.isArray(children) &&
				children.length === 2 &&
				typeof children[0] === 'number' &&
				typeof children[1] === 'number'
					? `${children[0]}-${children[1]}`
					: children}
			</span>
		</Component>
	);
});
