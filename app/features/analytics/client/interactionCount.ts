import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

const trackedInteractionCountAccessor =
	globalStore.persistence.donationModal.interactionCount;

export function incrementTrackedInteractionCount() {
	trackedInteractionCountAccessor.set((count) =>
		count === Number.MAX_SAFE_INTEGER ? count : count + 1
	);
}

export function readTrackedInteractionCount() {
	return trackedInteractionCountAccessor.get();
}

export function useTrackedInteractionCount() {
	return trackedInteractionCountAccessor.use();
}
