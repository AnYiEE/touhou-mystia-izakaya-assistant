import { type IAnalyticsTracker } from '@/features/analytics/contracts';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

import { readAnalyticsUserId } from './visitorIdentity';

const { analyticsApiUrl, analyticsSiteId, baseURL } = PUBLIC_RUNTIME_CONFIG;

export function pushMatomoCommands(...commands: unknown[][]) {
	globalThis._paq ??= [];
	globalThis._paq.push(...commands);
}

export function setAnalyticsUserId(
	tracker: Pick<IAnalyticsTracker, 'resetUserId' | 'setUserId'>,
	userId = readAnalyticsUserId()
) {
	if (userId === null) {
		tracker.resetUserId();
		return;
	}

	tracker.setUserId(userId);
}

export function pushWithAnalyticsUserId(
	callback: (tracker: IAnalyticsTracker) => void
) {
	const userId = readAnalyticsUserId();
	pushMatomoCommands([
		function trackWithAnalyticsUserId(this: IAnalyticsTracker) {
			setAnalyticsUserId(this, userId);
			callback(this);
		},
	]);
}

export function initializeMatomoQueue() {
	pushMatomoCommands(
		['enableHeartBeatTimer'],
		['enableLinkTracking'],
		['setCookieDomain', `*.${baseURL}`],
		['setRequestMethod', 'GET'],
		['setTrackerUrl', analyticsApiUrl],
		['setSecureCookie', true],
		['setSiteId', analyticsSiteId]
	);
}

export function trackPageView() {
	pushWithAnalyticsUserId((tracker) => {
		tracker.setCustomUrl(location.href);
		tracker.setDocumentTitle(document.title);
		tracker.trackPageView();
	});
}
