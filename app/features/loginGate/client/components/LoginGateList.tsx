'use client';

import { Fragment, type ReactNode } from 'react';

import { useLoginGateDisplayMode } from '@/features/loginGate/client/LoginGateContext';
import LoginGateVeil, {
	type ILoginGateVeilProps,
} from '@/features/loginGate/client/components/LoginGateVeil';

interface IProps<T> extends Pick<
	ILoginGateVeilProps,
	'countKind' | 'maxHeight' | 'overlay'
> {
	items: ReadonlyArray<T>;
	/**
	 * Wraps a run of rendered items, e.g. `(rows) => <Ol>{rows}</Ol>`. In
	 * preview mode the clear and veiled runs each get their own wrapper, so
	 * list markup stays valid.
	 */
	renderContainer?: (children: ReactNode) => ReactNode;
	/** Must return a keyed element, as in the host's original `map`. */
	renderItem: (item: T, index: number) => ReactNode;
	veilClassName?: string;
	veilContentClassName?: string;
	/** Items kept clear in preview mode. */
	visibleCount?: number;
}

function renderChildren(children: ReactNode) {
	return children;
}

/**
 * Drop-in replacement for `items.map(renderItem)` in a gated host. Renders
 * the plain map in full mode and when nothing would be hidden; otherwise the
 * first `visibleCount` items stay clear and the rest go behind a veil. The
 * veiled items are the real, complete output.
 */
export default function LoginGateList<T>({
	countKind,
	items,
	maxHeight,
	overlay,
	renderContainer = renderChildren,
	renderItem,
	veilClassName,
	veilContentClassName,
	visibleCount = 1,
}: IProps<T>) {
	const displayMode = useLoginGateDisplayMode();

	if (displayMode === 'full' || items.length <= visibleCount) {
		return <Fragment>{renderContainer(items.map(renderItem))}</Fragment>;
	}

	return (
		<Fragment>
			{renderContainer(items.slice(0, visibleCount).map(renderItem))}
			<LoginGateVeil
				className={veilClassName}
				contentClassName={veilContentClassName}
				count={items.length - visibleCount}
				countKind={countKind}
				displayMode={displayMode}
				maxHeight={maxHeight}
				overlay={overlay}
			>
				{renderContainer(
					items
						.slice(visibleCount)
						.map((item, index) =>
							renderItem(item, index + visibleCount)
						)
				)}
			</LoginGateVeil>
		</Fragment>
	);
}
