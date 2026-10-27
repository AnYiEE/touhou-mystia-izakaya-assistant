'use client';

import { memo, useCallback } from 'react';

import FeatureAccessNotice from '@/features/featureAccess/client/components/FeatureAccessNotice';
import { MapAssetProvider } from '@/features/maps/client/assets/MapAssetContext';
import { mapsMessages } from '@/features/maps/client/messages';
import { recoverMapAssetAccessState } from '@/features/maps/client/model/mapAssetAccessRecovery';

import { useI18n } from '@/shared/i18n/useI18n';

import { MapAccessProvider, useMapAccess } from './MapAccessContext';
import MapsPage from './MapsPage';

const MapsPageContent = memo(function MapsPageContent() {
	const { t } = useI18n(mapsMessages);
	const { policy } = useMapAccess();

	if (policy.mode === 'denied') {
		return (
			<div className="min-h-main-content p-4 text-foreground">
				<div className="mx-auto max-w-2xl space-y-4 rounded-medium border border-default-200 bg-content1 p-4 shadow-sm">
					<div className="space-y-2">
						<h1 className="text-xl font-semibold">
							{t('maps.title')}
						</h1>
						<p className="text-small leading-6 text-foreground-600">
							{t('maps.access.body')}
						</p>
					</div>
					<FeatureAccessNotice
						isActionFullWidth
						moduleKey="maps.preview"
					/>
				</div>
			</div>
		);
	}

	return <MapsPage />;
});

export default memo(function MapsPageEntry() {
	const handleAssetAccessFailure = useCallback(() => {
		recoverMapAssetAccessState();
	}, []);

	return (
		<MapAccessProvider>
			<MapAssetProvider onAccessFailure={handleAssetAccessFailure}>
				<MapsPageContent />
			</MapAssetProvider>
		</MapAccessProvider>
	);
});
