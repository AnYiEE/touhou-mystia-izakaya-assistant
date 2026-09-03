import type { TOverlayId } from '@/features/overlays/contracts';

import { type TPreferenceTargetKey } from '@/features/preferences/contracts';

import { globalStore } from './state/globalPersistenceStore';

export interface IOpenPreferencesModalOptions {
	openSource?: 'sideButton' | 'spotlight' | null;
	parentId?: TOverlayId;
	targetKey?: TPreferenceTargetKey | null;
}

export function openPreferencesModal(
	options: IOpenPreferencesModalOptions = {}
): void {
	const { openSource = null, parentId, targetKey = null } = options;

	globalStore.setPreferencesModalIsOpen(
		true,
		openSource,
		targetKey,
		parentId
	);
}

export function closePreferencesModal(): void {
	globalStore.setPreferencesModalIsOpen(false);
}
