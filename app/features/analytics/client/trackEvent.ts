import {
	type TActions,
	type TAdminSelect,
	type TError,
	type TItem,
	type TItemAlone,
	type TItemCard,
	TRACK_CATEGORY_MAP,
	type TShow,
	type TTrackAction,
	type TTrackCategory,
	type TTrackEvent,
} from '@/features/analytics/contracts';

import { incrementTrackedInteractionCount } from './interactionCount';
import { pushWithAnalyticsUserId } from './matomoQueue';

function trackEventFunction(
	category: typeof TRACK_CATEGORY_MAP.click,
	action: TActions | TItemCard,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: typeof TRACK_CATEGORY_MAP.error,
	action: TError,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category:
		| typeof TRACK_CATEGORY_MAP.select
		| typeof TRACK_CATEGORY_MAP.unselect,
	action: TAdminSelect | TItem | TItemAlone,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: typeof TRACK_CATEGORY_MAP.show,
	action: TShow,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: TTrackCategory,
	action: TTrackAction,
	name: string,
	value?: number | string
) {
	pushWithAnalyticsUserId((tracker) => {
		tracker.setCustomUrl(location.href);
		tracker.setDocumentTitle(document.title);
		tracker.trackEvent(category, action, name, value);
	});
	incrementTrackedInteractionCount();
}

export const trackEvent = trackEventFunction as TTrackEvent;

trackEvent.category = TRACK_CATEGORY_MAP;
