'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo } from 'react';

import Loading from '@/design/ui/components/loading';
import Placeholder from '@/design/ui/components/placeholder';

import { useSkipProcessItemData } from '@/features/catalog/shared/client/hooks/useSkipProcessItemData';

import { useHydrated } from '@/shared/react/useHydrated';

interface IProps {
	isEmpty: boolean;
	sideButton: ReactNodeWithoutBoolean;
}

export default memo<PropsWithChildren<IProps>>(function ItemPage({
	children,
	isEmpty,
	sideButton,
}) {
	const isMounted = useHydrated();
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
