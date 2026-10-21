import { trackEvent } from '@/features/analytics/client/trackEvent';
import { isOverlayIdleForTutorial } from '@/features/overlays/client/store';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import {
	type TDonationModalSource,
	createDonationModalOwnership,
	createDonationModalOwnershipRelease,
	openDonationModal,
	waitForDonationModalCloseOrAbort,
} from './state/donationModalStore';

const DONATION_MODAL_LOCK_NAME = 'donation-modal-trigger';
const DONATION_MODAL_LOCK_TTL_MS = 3000;

export function requestDonationModalOpen(source: TDonationModalSource) {
	if (!isOverlayIdleForTutorial()) {
		return Promise.resolve(false);
	}

	const ownership = createDonationModalOwnership();
	const releaseOwnership = createDonationModalOwnershipRelease(ownership);

	return withCrossTabLock(
		DONATION_MODAL_LOCK_NAME,
		async () => {
			try {
				if (
					!isOverlayIdleForTutorial() ||
					!openDonationModal(ownership, source)
				) {
					return false;
				}

				trackEvent(
					trackEvent.category.show,
					'Popover',
					'Donation Modal',
					source
				);

				await waitForDonationModalCloseOrAbort(ownership);

				return true;
			} finally {
				releaseOwnership();
			}
		},
		{
			fallbackTtl: DONATION_MODAL_LOCK_TTL_MS,
			ifAvailable: true,
			onFallbackLeaseLost: releaseOwnership,
			renewFallbackLease: true,
		}
	).then((result) => result === true);
}
