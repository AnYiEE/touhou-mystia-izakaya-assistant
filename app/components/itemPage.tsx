'use client';

import { type PropsWithChildren, memo } from 'react';

import { useMounted, useSkipProcessItemData } from '@/hooks';

import { cn } from '@/design/ui/components';

import Loading from '@/loading';
import Placeholder from '@/components/placeholder';

interface IProps {
	isEmpty: boolean;
	sideButton: ReactNodeWithoutBoolean;
}

export default memo<PropsWithChildren<IProps>>(function ItemPage({
	children,
	isEmpty,
	sideButton,
}) {
	const isMounted = useMounted();
	const shouldSkipProcessData = useSkipProcessItemData();

	if (!isMounted) {
		return <Loading />;
	}

	return (
		<div
			className={cn(
				'min-h-main-content',
				isEmpty
					? 'flex justify-center'
					: 'grid h-min grid-cols-2 content-start justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
			)}
		>
			{!shouldSkipProcessData && sideButton}
			{isEmpty ? <Placeholder>数据为空</Placeholder> : children}
		</div>
	);
});
