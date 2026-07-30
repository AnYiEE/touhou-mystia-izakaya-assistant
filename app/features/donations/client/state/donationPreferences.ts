import { readTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { getCurrentDonationMilestone } from '@/features/donations/client/milestones';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import { donationModalStore } from './donationModalStore';

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
	const currentCount = readTrackedInteractionCount();
	const milestone = getCurrentDonationMilestone(currentCount);
	writeDonationLastMilestoneShown(milestone);
	donationModalStore.isOpen.set(false);
}

export function remindDonationModalLater() {
	writeDonationLastMilestoneShown(0);
	writeDonationLastShown(Date.now());
	donationModalStore.isOpen.set(false);
}
