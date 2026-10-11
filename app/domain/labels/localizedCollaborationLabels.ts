import {
	COLLABORATION_LABEL_MAP,
	type TCollaborationLabel,
} from '@/domain/data/labels/collaborationFacts';
import { COLLABORATION_LOCALIZATION_LOADERS } from '@/domain/data/labels/localization';
import type { TCollaborationLocalizationLoader } from '@/domain/data/localization/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

let activeLabels: Readonly<Partial<Record<string, string | null>>> | null =
	null;

const loaders: TCollaborationLocalizationLoader =
	COLLABORATION_LOCALIZATION_LOADERS;

export function deactivateCollaborationLabels() {
	activeLabels = null;
}

export async function activateCollaborationLabels(locale: TLocale) {
	if (locale === DEFAULT_LOCALE) {
		deactivateCollaborationLabels();
		return;
	}

	const loader = loaders[locale];
	if (loader === undefined) {
		deactivateCollaborationLabels();
		return;
	}

	const localization = await loader();
	activeLabels = localization.labels;
}

export function getCollaborationLabel(id: TCollaborationLabel) {
	return activeLabels?.[id] ?? COLLABORATION_LABEL_MAP[id];
}
