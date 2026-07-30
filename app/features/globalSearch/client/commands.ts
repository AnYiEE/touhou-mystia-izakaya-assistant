import type { IGlobalSearchTransientTarget } from '@/features/globalSearch/contracts';
import {
	getActiveOverlayTaskId,
	pushOverlayChild,
	requestOverlayClose,
	requestOverlayOpen,
} from '@/features/overlays/client';
import type { TOverlayRequestResult } from '@/features/overlays/contracts';

import { globalSearchStore } from './state/store';

export function openGlobalSearch(): TOverlayRequestResult {
	const onActivate = () => {
		globalSearchStore.isOpen.set(true);
	};
	const activeTaskId = getActiveOverlayTaskId();
	if (activeTaskId === 'global.search') {
		onActivate();
		return { status: 'activated' };
	}
	if (activeTaskId !== null) {
		return pushOverlayChild({
			childId: 'global.search',
			onOpenChild: onActivate,
			parentId: activeTaskId,
		});
	}
	return requestOverlayOpen('global.search', { onActivate });
}

export function closeGlobalSearch() {
	globalSearchStore.isOpen.set(false);
	requestOverlayClose('global.search');
}

export function setGlobalSearchTransientTarget(
	target: IGlobalSearchTransientTarget | null
) {
	globalSearchStore.transientTarget.set(target);
}
