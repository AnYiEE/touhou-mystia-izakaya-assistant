import type { TLocale } from '@/shared/i18n/locale';

import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { resolveEffectiveLocale } from '@/features/preferences/client/state/localeMirror';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { setActiveLocalizationLocale } from './activeLocalizationLocale';
import { bumpCatalogLocalizationRevision } from './catalogLocalizationRevision';
import { CATALOG_LOCALIZATION_TARGETS } from './catalogLocalizationTargets';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

let activeRequestId = 0;
let isStopped = true;

async function activateCatalogLocalization(locale: TLocale) {
	const requestId = ++activeRequestId;

	if (locale === 'zh-CN') {
		for (const target of CATALOG_LOCALIZATION_TARGETS) {
			target.deactivate();
		}
		setActiveLocalizationLocale('zh-CN');
		bumpCatalogLocalizationRevision();
		return;
	}

	try {
		await Promise.all(
			CATALOG_LOCALIZATION_TARGETS.map((target) =>
				target.activate(locale)
			)
		);
	} catch (error) {
		console.warn('Catalog localization failed to load.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return;
	}

	if (isStopped || requestId !== activeRequestId) {
		return;
	}

	setActiveLocalizationLocale(locale);
	bumpCatalogLocalizationRevision();
}

export function startCatalogLocalizationClient(
	routeLocale: TLocale | null = null
) {
	if (isServer) {
		return () => {};
	}

	isStopped = false;
	const applyCurrentPreference = () => {
		void activateCatalogLocalization(
			resolveEffectiveLocale(
				globalStore.persistence.locale.get(),
				routeLocale
			)
		);
	};

	applyCurrentPreference();

	const unsubscribe = globalStore.persistence.locale.onChange(() => {
		applyCurrentPreference();
	});

	return () => {
		isStopped = true;
		unsubscribe();
	};
}
