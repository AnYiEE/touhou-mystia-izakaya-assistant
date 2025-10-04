import { type PropsWithChildren, memo } from 'react';
import { isNil, isObject } from 'lodash';

import { cn } from '@/design/ui/components';

function findStringContent(node: unknown, depth = 0): string | null {
	if (depth >= 10 || isNil(node)) {
		return null;
	}

	if (typeof node === 'string') {
		return node.trim();
	}

	if (
		isObject(node) &&
		'props' in node &&
		isObject(node.props) &&
		'children' in node.props
	) {
		const { children } = node.props;

		if (Array.isArray(children)) {
			for (const child of children) {
				const result = findStringContent(child, depth + 1);
				if (result !== null) {
					return result;
				}
			}
		} else {
			return findStringContent(children, depth + 1);
		}
	}

	return null;
}

interface ILiProps extends Pick<HTMLLIElementAttributes, 'className'> {}

const Li = memo<PropsWithChildren<ILiProps>>(function Li({
	children,
	className,
}) {
	const content = findStringContent(children);

	return (
		<li>
			<span
				className={cn(
					'relative -left-0.5',
					content?.startsWith('【') && '-left-2',
					className
				)}
			>
				{children}
			</span>
		</li>
	);
});

interface IOlProps extends Pick<HTMLOListElementAttributes, 'className'> {}

const OlComponent = memo<PropsWithChildren<IOlProps>>(function Ol({
	children,
	className,
}) {
	return (
		<ol
			className={cn(
				'list-inside list-disc break-all text-justify',
				className
			)}
		>
			{children}
		</ol>
	);
});

const Ol = OlComponent as typeof OlComponent & { Li: typeof Li };

Ol.Li = Li;

export default Ol;
