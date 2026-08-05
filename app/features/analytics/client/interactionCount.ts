import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { canIncrementNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

const trackedInteractionCountAccessor =
	globalStore.persistence.donationModal.interactionCount;

export function incrementTrackedInteractionCount() {
	trackedInteractionCountAccessor.set((count) =>
		canIncrementNonNegativeSafeInteger(count)
			? count + 1
			: count === Number.MAX_SAFE_INTEGER
				? count
				: 1
	);
}

export function readTrackedInteractionCount() {
	return trackedInteractionCountAccessor.get();
}

export function useTrackedInteractionCount() {
	return trackedInteractionCountAccessor.use();
}
