import {
	claimBottomNudge,
	getBottomNudgeOwner,
	releaseBottomNudge,
} from '@/design/ui/bottomNudgeCoordinator';

import { readTrackedInteractionCount } from '@/features/analytics/client/interactionCount';
import { trackEventWithoutInteractionCount } from '@/features/analytics/client/trackEvent';
import { isOverlayIdleForTutorial } from '@/features/overlays/client/store';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import { checkDonationModalRequestValid } from './milestones';
import {
	readDonationLastMilestoneShown,
	readDonationLastShown,
} from './state/donationPreferences';
import {
	markSupportNudgeShown,
	supportNudgeStore,
} from './state/supportNudgeStore';
import { shouldShowSupportNudge } from './supportNudgePolicy';

const SUPPORT_NUDGE_LOCK_NAME = 'support-nudge';
const SUPPORT_NUDGE_LOCK_TTL_MS = 3000;
export const SUPPORT_NUDGE_BLOCKER_SELECTOR = [
	'[data-support-nudge-blocker]',
	'[data-slot="popover"][data-open="true"]',
	'[data-slot="base"][data-open="true"][role="dialog"]',
	'[role="listbox"]',
	'[role="menu"]',
].join(',');

function isMilestoneDue() {
	return checkDonationModalRequestValid({
		interactionCount: readTrackedInteractionCount(),
		lastMilestoneShown: readDonationLastMilestoneShown(),
		lastShown: readDonationLastShown(),
	});
}

function hasBlockingSupportNudgeOverlay() {
	return (
		!isOverlayIdleForTutorial() ||
		document.querySelector(SUPPORT_NUDGE_BLOCKER_SELECTOR) !== null
	);
}

export async function requestSupportNudge() {
	const currentState = supportNudgeStore.get();
	if (
		hasBlockingSupportNudgeOverlay() ||
		isMilestoneDue() ||
		currentState.visible ||
		currentState.pendingSince === null ||
		currentState.suppressUntil > Date.now() ||
		!shouldShowSupportNudge({
			lastShownAt: currentState.persistence.lastShownAt,
			sessionScore: currentState.sessionScore,
		}) ||
		!claimBottomNudge('support')
	) {
		return false;
	}

	const didShow = await withCrossTabLock(
		SUPPORT_NUDGE_LOCK_NAME,
		() => {
			const state = supportNudgeStore.get();
			const now = Date.now();
			if (
				getBottomNudgeOwner() !== 'support' ||
				hasBlockingSupportNudgeOverlay() ||
				isMilestoneDue() ||
				state.visible ||
				state.pendingSince === null ||
				state.suppressUntil > now ||
				!shouldShowSupportNudge({
					lastShownAt: state.persistence.lastShownAt,
					now,
					sessionScore: state.sessionScore,
				})
			) {
				return false;
			}

			markSupportNudgeShown(now);

			return true;
		},
		{ fallbackTtl: SUPPORT_NUDGE_LOCK_TTL_MS, ifAvailable: true }
	);

	if (didShow !== true) {
		releaseBottomNudge('support');
		return false;
	}

	trackEventWithoutInteractionCount(
		trackEventWithoutInteractionCount.category.show,
		'Banner',
		'Donation Nudge'
	);

	return true;
}
