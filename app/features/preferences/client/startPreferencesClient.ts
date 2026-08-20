import { compareVersions } from 'compare-versions';

import { trackEvent } from '@/features/analytics/client/trackEvent';

import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';

import { SITE_METADATA } from '@/shared/site/metadata';

import { createCatalogPreferencesProjection } from './catalogPreferencesProjection';
import {
	globalSettingKeyIsHighAppearance,
	globalStore,
} from './state/globalPersistenceStore';

const { version: appVersion } = SITE_METADATA;

function applyHighAppearance(isEnabled: boolean) {
	document.body.classList.toggle('bg-blend-mystia-pseudo', isEnabled);
	if (isEnabled) {
		safeStorage.removeItem(globalSettingKeyIsHighAppearance);
	} else {
		safeStorage.setItem(
			globalSettingKeyIsHighAppearance,
			Number(isEnabled).toString()
		);
	}
}

function handleVersionChange(version: string | null) {
	if (version && compareVersions(version, appVersion) === 1) {
		trackEvent(
			trackEvent.category.error,
			'Update',
			'Outdated version detected in multiple tabs',
			`${appVersion}, ${version}`
		);
		setTimeout(() => {
			location.reload();
		}, 200);
	}
}

export function startPreferencesClient() {
	applyHighAppearance(globalStore.persistence.highAppearance.get());
	handleVersionChange(globalStore.persistence.version.get());

	const stopHighAppearance =
		globalStore.persistence.highAppearance.onChange(applyHighAppearance);
	const stopVersion =
		globalStore.persistence.version.onChange(handleVersionChange);
	const catalogProjection = createCatalogPreferencesProjection();
	const stopCatalogProjection = catalogProjection.start();

	return () => {
		stopVersion();
		stopHighAppearance();
		stopCatalogProjection();
	};
}
