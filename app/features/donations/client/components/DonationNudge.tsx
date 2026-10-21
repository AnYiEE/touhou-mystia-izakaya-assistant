'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { releaseBottomNudge } from '@/design/ui/bottomNudgeCoordinator';
import BottomNudge from '@/design/ui/components/bottomNudge';
import Button from '@/design/ui/components/button';

import { useTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import {
	trackEvent,
	trackEventWithoutInteractionCount,
} from '@/features/analytics/client/trackEvent';
import { useDocumentVisibility } from '@/features/donations/client/hooks/useDocumentVisibility';
import { donationMessages } from '@/features/donations/client/messages';
import { checkDonationModalRequestValid } from '@/features/donations/client/milestones';
import { requestDonationModalOpen } from '@/features/donations/client/requestDonationModalOpen';
import {
	SUPPORT_NUDGE_BLOCKER_SELECTOR,
	requestSupportNudge,
} from '@/features/donations/client/requestSupportNudge';
import {
	useDonationLastMilestoneShown,
	useDonationLastShown,
} from '@/features/donations/client/state/donationPreferences';
import {
	discardPendingSupportNudge,
	dismissSupportNudge,
	resetSupportNudgeValueProgress,
	supportNudgeStore,
} from '@/features/donations/client/state/supportNudgeStore';
import {
	SUPPORT_NUDGE_INTERVAL_MS,
	SUPPORT_NUDGE_PENDING_TTL_MS,
	SUPPORT_NUDGE_TIMEOUT_MS,
	SUPPORT_NUDGE_VALUE_THRESHOLD,
} from '@/features/donations/client/supportNudgePolicy';
import {
	useIsTutorialActive,
	useOverlayIdleForTutorial,
} from '@/features/overlays/client';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { pwaInstallStore } from '@/features/pwa/client/installStore';

import { useI18n } from '@/shared/i18n/useI18n';
import { siteMessages } from '@/shared/site/messages';

const COUNTDOWN_INTERVAL_MS = 250;
const SUPPORT_NUDGE_REQUEST_DELAY_MS = 100;

function useHasBlockingLocalOverlay(isEnabled: boolean) {
	const [hasBlockingLocalOverlay, setHasBlockingLocalOverlay] =
		useState(false);

	useEffect(() => {
		if (!isEnabled) {
			setHasBlockingLocalOverlay(false);
			return;
		}

		const update = () => {
			setHasBlockingLocalOverlay(
				document.querySelector(SUPPORT_NUDGE_BLOCKER_SELECTOR) !== null
			);
		};

		let updateFrame: number | null = null;
		const scheduleUpdate = () => {
			if (updateFrame !== null) {
				return;
			}
			updateFrame = requestAnimationFrame(() => {
				updateFrame = null;
				update();
			});
		};

		update();

		const observer = new MutationObserver(scheduleUpdate);

		observer.observe(document.body, {
			attributeFilter: [
				'aria-expanded',
				'data-open',
				'data-support-nudge-blocker',
			],
			attributes: true,
			childList: true,
			subtree: true,
		});

		return () => {
			if (updateFrame !== null) {
				cancelAnimationFrame(updateFrame);
			}
			observer.disconnect();
		};
	}, [isEnabled]);

	return hasBlockingLocalOverlay;
}

export default function DonationNudge() {
	const { t } = useI18n(donationMessages);
	const { t: tSite } = useI18n(siteMessages);
	const vibrate = useVibrate();

	const isDocumentVisible = useDocumentVisibility();
	const isTutorialActive = useIsTutorialActive();
	const isOverlayIdle = useOverlayIdleForTutorial();

	const lastMilestoneShown = useDonationLastMilestoneShown();
	const lastShown = useDonationLastShown();
	const interactionCount = useTrackedInteractionCount();
	const isMilestoneDue = checkDonationModalRequestValid({
		interactionCount,
		lastMilestoneShown,
		lastShown,
	});

	const pendingSince = supportNudgeStore.pendingSince.use();
	const persistenceLastShownAt =
		supportNudgeStore.persistence.lastShownAt.use();
	const sessionScore = supportNudgeStore.sessionScore.use();
	const suppressUntil = supportNudgeStore.suppressUntil.use();
	const isVisible = supportNudgeStore.visible.use();
	const isPwaNudgeVisible = pwaInstallStore.nudgeVisible.use();
	const hasBlockingLocalOverlay = useHasBlockingLocalOverlay(
		pendingSince !== null || isVisible
	);

	const [remainingSeconds, setRemainingSeconds] = useState(
		Math.ceil(SUPPORT_NUDGE_TIMEOUT_MS / 1000)
	);
	const [wakeupVersion, setWakeupVersion] = useState(0);
	const remainingMsRef = useRef(SUPPORT_NUDGE_TIMEOUT_MS);

	const hideCurrentNudge = useCallback(() => {
		releaseBottomNudge('support');
		dismissSupportNudge();
	}, []);

	const handleDismiss = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Nudge Button',
			'Dismiss'
		);
		hideCurrentNudge();
	}, [hideCurrentNudge, vibrate]);

	const handleSupport = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Donation Nudge Button',
			'Support'
		);
		hideCurrentNudge();
		void requestDonationModalOpen('nudge');
	}, [hideCurrentNudge, vibrate]);

	const handleTimeout = useCallback(() => {
		if (!supportNudgeStore.visible.get()) {
			return;
		}
		trackEventWithoutInteractionCount(
			trackEventWithoutInteractionCount.category.click,
			'Donation Nudge Button',
			'Timeout'
		);
		hideCurrentNudge();
	}, [hideCurrentNudge]);

	useEffect(() => {
		if (isTutorialActive) {
			if (isVisible) {
				hideCurrentNudge();
			}
			resetSupportNudgeValueProgress();
		}
	}, [hideCurrentNudge, isTutorialActive, isVisible]);

	useEffect(() => {
		if (pendingSince === null) {
			return;
		}

		const now = Date.now();
		const expiresAt = pendingSince + SUPPORT_NUDGE_PENDING_TTL_MS;
		if (expiresAt <= now) {
			discardPendingSupportNudge();
			return;
		}

		const eligibleAt = Math.max(
			suppressUntil,
			persistenceLastShownAt === null
				? 0
				: persistenceLastShownAt + SUPPORT_NUDGE_INTERVAL_MS
		);
		const timeout = setTimeout(
			() => {
				if (Date.now() >= expiresAt) {
					discardPendingSupportNudge();
					return;
				}
				setWakeupVersion((value) => value + 1);
			},
			Math.max(0, Math.min(expiresAt, eligibleAt) - now)
		);

		return () => {
			clearTimeout(timeout);
		};
	}, [pendingSince, persistenceLastShownAt, suppressUntil]);

	useEffect(() => {
		if (
			!isDocumentVisible ||
			!isOverlayIdle ||
			hasBlockingLocalOverlay ||
			isPwaNudgeVisible ||
			isMilestoneDue ||
			isVisible ||
			pendingSince === null ||
			suppressUntil > Date.now() ||
			sessionScore < SUPPORT_NUDGE_VALUE_THRESHOLD
		) {
			return;
		}

		const timeout = setTimeout(() => {
			void requestSupportNudge();
		}, SUPPORT_NUDGE_REQUEST_DELAY_MS);

		return () => {
			clearTimeout(timeout);
		};
	}, [
		hasBlockingLocalOverlay,
		isDocumentVisible,
		isMilestoneDue,
		isOverlayIdle,
		isPwaNudgeVisible,
		isVisible,
		pendingSince,
		sessionScore,
		suppressUntil,
		wakeupVersion,
	]);

	useEffect(() => {
		if (isVisible && (isMilestoneDue || isPwaNudgeVisible)) {
			hideCurrentNudge();
		}
	}, [hideCurrentNudge, isMilestoneDue, isPwaNudgeVisible, isVisible]);

	useEffect(() => {
		if (isVisible) {
			remainingMsRef.current = SUPPORT_NUDGE_TIMEOUT_MS;
			setRemainingSeconds(Math.ceil(SUPPORT_NUDGE_TIMEOUT_MS / 1000));
			return;
		}

		remainingMsRef.current = SUPPORT_NUDGE_TIMEOUT_MS;
	}, [isVisible]);

	useEffect(() => {
		if (!isVisible || !isDocumentVisible) {
			return;
		}

		const startedAt = Date.now();
		const startingRemainingMs = remainingMsRef.current;
		let didExpire = false;

		const updateCountdown = () => {
			const nextRemainingMs =
				startingRemainingMs - (Date.now() - startedAt);
			remainingMsRef.current = Math.max(0, nextRemainingMs);
			if (nextRemainingMs <= 0) {
				if (!didExpire) {
					didExpire = true;
					handleTimeout();
				}
				return;
			}
			setRemainingSeconds(Math.ceil(nextRemainingMs / 1000));
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, COUNTDOWN_INTERVAL_MS);

		return () => {
			clearInterval(interval);
			remainingMsRef.current = Math.max(
				0,
				startingRemainingMs - (Date.now() - startedAt)
			);
		};
	}, [handleTimeout, isDocumentVisible, isVisible]);

	const title = t('donation.nudge.title');
	const body = t('donation.nudge.body', {
		shortName: tSite('site.shortName'),
	});
	const dismissLabel = t('donation.nudge.dismiss', {
		seconds: remainingSeconds,
	});

	return (
		<BottomNudge
			isVisible={isVisible}
			nudgeKey="support-nudge"
			onSwipeDismiss={handleDismiss}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="text-small font-medium">{title}</p>
				<p className="text-tiny text-foreground-500">{body}</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<Button size="sm" variant="light" onPress={handleDismiss}>
					{dismissLabel}
				</Button>
				<Button
					color="primary"
					size="sm"
					variant="solid"
					onPress={handleSupport}
				>
					{t('donation.nudge.support')}
				</Button>
			</div>
		</BottomNudge>
	);
}
