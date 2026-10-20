'use client';

import { cn } from '@heroui/theme';
import { type PropsWithChildren, memo } from 'react';

import Loading from '@/design/ui/components/loading';
import Placeholder from '@/design/ui/components/placeholder';
import { getSideBookmarkPositionClassName } from '@/design/ui/components/SideBookmarkButton';

import { useSkipProcessItemData } from '@/features/catalog/shared/client/hooks/useSkipProcessItemData';
import { useCatalogLocalizationReady } from '@/features/catalog/shared/client/localization/useCatalogLocalizationReady';
import { catalogSharedMessages } from '@/features/catalog/shared/client/messages';
import WorldMapButton from '@/features/maps/client/components/WorldMapButton';

import { useI18n } from '@/shared/i18n/useI18n';
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
	const isLocalizationReady = useCatalogLocalizationReady();
	const isMounted = useHydrated();
	const { t } = useI18n(catalogSharedMessages);
	const shouldSkipProcessData = useSkipProcessItemData();

	if (!isMounted || !isLocalizationReady) {
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
			<div className={getSideBookmarkPositionClassName(1300)}>
				<WorldMapButton expandAtWidth={1300} isCatalogEntry />
			</div>
			{isEmpty ? (
				<Placeholder>{t('catalog.itemPage.empty')}</Placeholder>
			) : (
				children
			)}
		</div>
	);
});
