import { readTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { getCurrentDonationMilestone } from '@/features/donations/client/milestones';
import { SUPPORT_MILESTONE_NUDGE_SUPPRESSION_MS } from '@/features/donations/client/supportNudgePolicy';
import { suppressSupportNudgeUntil } from '@/features/donations/client/state/supportNudgeStore';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import {
	closeActiveDonationModal,
	deferMilestoneUntilNextInteraction,
	donationModalStore,
} from './donationModalStore';

export function readDonationLastMilestoneShown() {
	return globalStore.persistence.donationModal.lastMilestoneShown.get();
}

export function useDonationLastMilestoneShown() {
	return globalStore.persistence.donationModal.lastMilestoneShown.use();
}

export function writeDonationLastMilestoneShown(milestone: number) {
	globalStore.persistence.donationModal.lastMilestoneShown.set(milestone);
}

export function readDonationLastShown() {
	return globalStore.persistence.donationModal.lastShown.get();
}

export function useDonationLastShown() {
	return globalStore.persistence.donationModal.lastShown.use();
}

export function writeDonationLastShown(timestamp: number) {
	globalStore.persistence.donationModal.lastShown.set(timestamp);
}

export function closeDonationModal() {
	const source = donationModalStore.source.get();
	if (source === 'milestone') {
		const currentCount = readTrackedInteractionCount();
		const milestone = getCurrentDonationMilestone(currentCount);
		writeDonationLastMilestoneShown(milestone);
		suppressSupportNudgeUntil(
			Date.now() + SUPPORT_MILESTONE_NUDGE_SUPPRESSION_MS
		);
	} else if (source === 'manual' || source === 'nudge') {
		deferMilestoneUntilNextInteraction(readTrackedInteractionCount());
	}
	closeActiveDonationModal();
}

export function remindDonationModalLater() {
	if (donationModalStore.source.get() === 'milestone') {
		const now = Date.now();
		writeDonationLastMilestoneShown(0);
		writeDonationLastShown(now);
		suppressSupportNudgeUntil(now + SUPPORT_MILESTONE_NUDGE_SUPPRESSION_MS);
	}
	closeActiveDonationModal();
}
