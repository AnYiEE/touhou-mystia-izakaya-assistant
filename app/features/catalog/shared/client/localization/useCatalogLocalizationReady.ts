'use client';

import { useCurrentLocale } from '@/shared/i18n/useI18n';

import { useCatalogLocalizationRevision } from './catalogLocalizationRevision';
import { checkInitialCatalogLocalizationSettled } from './catalogLocalizationRuntime';

/**
 * @description Whether localized catalogue text may be painted. Simplified
 * Chinese reads the canonical data directly; every other locale waits for the
 * first localization attempt so the canonical Chinese text is never shown.
 */
export function useCatalogLocalizationReady(): boolean {
	useCatalogLocalizationRevision();

	return (
		useCurrentLocale() === 'zh-CN' ||
		checkInitialCatalogLocalizationSettled()
	);
}
