'use client';

import { useEffect, useRef } from 'react';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import { useHydrated } from '@/shared/react/useHydrated';

import {
	checkDonationModalRequestValid,
	getCurrentDonationMilestone,
} from './milestones';
import {
	createDonationModalOwnership,
	createDonationModalOwnershipRelease,
	donationModalStore,
	openDonationModal,
	waitForDonationModalCloseOrAbort,
} from './state/donationModalStore';
import {
	useDonationLastMilestoneShown,
	useDonationLastShown,
} from './state/donationPreferences';

const DONATION_MODAL_LOCK_NAME = 'donation-modal-trigger';
const DONATION_MODAL_LOCK_TTL_MS = 3000;
const DONATION_MODAL_LOCK_VERIFY_DELAY_MS = 150;

function delayDonationModalLockVerify() {
	return new Promise((resolve) => {
		setTimeout(resolve, DONATION_MODAL_LOCK_VERIFY_DELAY_MS);
	});
}

export function useDonationModalTrigger() {
	const isMounted = useHydrated();
	const { pathname } = usePathname();
	const ownershipControllerRef = useRef<AbortController | null>(null);

	const isOpen = donationModalStore.isOpen.use();
	const interactionCount = useTrackedInteractionCount();
	const lastMilestoneShown = useDonationLastMilestoneShown();
	const lastShown = useDonationLastShown();
	const isRequestValid = checkDonationModalRequestValid({
		interactionCount,
		lastMilestoneShown,
		lastShown,
	});

	useEffect(() => {
		if (!isMounted) {
			return;
		}

		const ownershipController = new AbortController();
		ownershipControllerRef.current = ownershipController;

		return () => {
			if (ownershipControllerRef.current === ownershipController) {
				ownershipControllerRef.current = null;
			}
			ownershipController.abort();
		};
	}, [isMounted]);

	useEffect(() => {
		const ownershipController = ownershipControllerRef.current;
		if (
			isOpen ||
			!isMounted ||
			!isRequestValid ||
			ownershipController === null
		) {
			return;
		}

		const currentMilestone = getCurrentDonationMilestone(interactionCount);
		const ownership = createDonationModalOwnership();
		const releaseOwnership = createDonationModalOwnershipRelease(ownership);
		let isEffectActive = true;
		void withCrossTabLock(
			DONATION_MODAL_LOCK_NAME,
			async () => {
				try {
					await delayDonationModalLockVerify();
					if (
						!isEffectActive ||
						ownershipController.signal.aborted ||
						!openDonationModal(ownership)
					) {
						return;
					}

					trackEvent(
						trackEvent.category.show,
						'Popover',
						'Donation Modal',
						currentMilestone
					);
					await waitForDonationModalCloseOrAbort(
						ownership,
						ownershipController.signal
					);
				} finally {
					releaseOwnership();
				}
			},
			{
				fallbackTtl: DONATION_MODAL_LOCK_TTL_MS,
				ifAvailable: true,
				onFallbackLeaseLost: () => {
					releaseOwnership();
				},
				renewFallbackLease: true,
			}
		);

		return () => {
			isEffectActive = false;
		};
	}, [interactionCount, isMounted, isOpen, isRequestValid, pathname]);
}
