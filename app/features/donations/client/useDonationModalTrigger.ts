'use client';

import { useEffect, useRef } from 'react';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import {
	useIsTutorialActive,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import { isOverlayIdleForTutorial } from '@/features/overlays/client/store';

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
	readDeferredMilestoneInteractionCount,
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
	const isTutorialActive = useIsTutorialActive();
	const isOverlayIdle = useOverlayIdleForTutorial();
	const { pathname } = usePathname();

	const ignoredInteractionCountRef = useRef<number | null>(null);
	const ownershipControllerRef = useRef<AbortController | null>(null);
	const wasTutorialActiveRef = useRef(false);

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
		if (isTutorialActive) {
			wasTutorialActiveRef.current = true;
			ignoredInteractionCountRef.current = interactionCount;
			return;
		}

		if (wasTutorialActiveRef.current) {
			wasTutorialActiveRef.current = false;
			ignoredInteractionCountRef.current = interactionCount;
		}
	}, [interactionCount, isTutorialActive]);

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
			isTutorialActive ||
			!isOverlayIdle ||
			(ignoredInteractionCountRef.current !== null &&
				interactionCount <= ignoredInteractionCountRef.current) ||
			interactionCount <= readDeferredMilestoneInteractionCount() ||
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
						!isOverlayIdleForTutorial() ||
						!openDonationModal(ownership, 'milestone')
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
	}, [
		interactionCount,
		isMounted,
		isOpen,
		isOverlayIdle,
		isRequestValid,
		isTutorialActive,
		pathname,
	]);
}
