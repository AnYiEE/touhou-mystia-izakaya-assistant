'use client';

import { useEffect, useRef } from 'react';

import { useMounted, usePathname } from '@/hooks';

import { siteConfig } from '@/configs';
import { accountStore, globalStore } from '@/stores';
import { setScriptUrlTag } from '@/utilities';

const { analyticsApiUrl, analyticsScriptUrl, analyticsSiteId, baseURL } =
	siteConfig;

let isTrackerLoadingOrLoaded = false;

function push(...args: unknown[][]) {
	globalThis._paq ??= [];
	globalThis._paq.push(...args);
}

function getAnalyticsUserId() {
	if (accountStore.shared.isLoggedIn.get()) {
		return accountStore.shared.user.get()?.id ?? null;
	}

	return globalStore.persistence.userId.get();
}

interface IMatomoTracker {
	ping(): void;
	resetUserId(): void;
	setCustomUrl(url: string): void;
	setDocumentTitle(title: string): void;
	setUserId(userId: string): void;
	trackEvent(
		category: TTrackCategory,
		action:
			| TActions
			| TAdminSelect
			| TError
			| TItem
			| TItemAlone
			| TItemCard
			| TShow,
		name: string,
		value?: number | string
	): void;
	trackPageView(): void;
}

function setAnalyticsUserId(
	tracker: Pick<IMatomoTracker, 'resetUserId' | 'setUserId'>,
	userId = getAnalyticsUserId()
) {
	if (userId === null) {
		tracker.resetUserId();
		return;
	}

	tracker.setUserId(userId);
}

function pushWithAnalyticsUserId(callback: (tracker: IMatomoTracker) => void) {
	const userId = getAnalyticsUserId();
	push([
		function trackWithAnalyticsUserId(this: IMatomoTracker) {
			setAnalyticsUserId(this, userId);
			callback(this);
		},
	]);
}

const trackCategoryMap = {
	click: 'Click',
	error: 'Error',
	select: 'Select',
	show: 'Show',
	unselect: 'Unselect',
} as const;

type TTrackCategory = ExtractCollectionValue<typeof trackCategoryMap>;

type TAction =
	| 'Account'
	| 'Account Auth'
	| 'Account Conflict'
	| 'Account Password'
	| 'Account SSO'
	| 'Account Sync'
	| 'Admin Audit'
	| 'Admin Auth'
	| 'Admin SSO Callback'
	| 'Admin SSO Callback History'
	| 'Admin SSO Client'
	| 'Admin SSO Grant'
	| 'Admin SSO Ticket'
	| 'Admin User Action'
	| 'Admin User Detail'
	| 'Cloud Delete'
	| 'Cloud Download'
	| 'Cloud Upload'
	| 'Donation Modal'
	| 'Error'
	| 'Export'
	| 'Global Search'
	| 'Import'
	| 'Info'
	| 'OpenWindow'
	| 'PIP'
	| 'Remove'
	| 'Reset'
	| 'Save'
	| 'Share'
	| 'Select'
	| 'SSO Authorize'
	| 'Theme'
	| 'Tutorial';
type TActions = `${TAction} Button` | 'Link';

type TItem =
	| 'Beverage'
	| 'Clothes'
	| 'Cooker'
	| 'Currency'
	| 'Ingredient'
	| 'Ornament'
	| 'Partner'
	| 'Recipe';
type TItemAlone = 'Customer' | 'Customer Tag' | 'MystiaCooker';
type TItemCard = `${TItem} Card`;
type TAdminSelect = 'Admin User Status';

type TError = 'Cloud' | 'Global' | 'SSO' | 'Update';
type TShow = 'Modal' | 'Popover' | 'Tooltip';

function trackEventFunction(
	category: typeof trackCategoryMap.click,
	action: TActions | TItemCard,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: typeof trackCategoryMap.error,
	action: TError,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: typeof trackCategoryMap.select | typeof trackCategoryMap.unselect,
	action: TAdminSelect | TItem | TItemAlone,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: typeof trackCategoryMap.show,
	action: TShow,
	name: string,
	value?: number | string
): void;
function trackEventFunction(
	category: TTrackCategory,
	action:
		| TActions
		| TAdminSelect
		| TError
		| TItem
		| TItemAlone
		| TItemCard
		| TShow,
	name: string,
	value?: number | string
) {
	pushWithAnalyticsUserId((tracker) => {
		tracker.setCustomUrl(location.href);
		tracker.setDocumentTitle(document.title);
		tracker.trackEvent(category, action, name, value);
	});
	globalStore.persistence.donationModal.interactionCount.set((count) => {
		if (count === Number.MAX_SAFE_INTEGER) {
			return count;
		}
		return count + 1;
	});
}

export const trackEvent = trackEventFunction as typeof trackEventFunction & {
	category: typeof trackCategoryMap;
};

trackEvent.category = trackCategoryMap;

function trackPageView() {
	pushWithAnalyticsUserId((tracker) => {
		tracker.setCustomUrl(location.href);
		tracker.setDocumentTitle(document.title);
		tracker.trackPageView();
	});
}

export function ping() {
	pushWithAnalyticsUserId((tracker) => {
		tracker.ping();
	});
}

export default function Analytics() {
	useMounted(() => {
		// The tracker has been requested, skip.
		if (isTrackerLoadingOrLoaded) {
			return;
		}
		isTrackerLoadingOrLoaded = true;

		// Initialize tracker.
		push(
			['enableHeartBeatTimer'],
			['enableLinkTracking'],
			['setCookieDomain', `*.${baseURL}`],
			['setRequestMethod', 'GET'],
			['setTrackerUrl', analyticsApiUrl],
			['setSecureCookie', true],
			['setSiteId', analyticsSiteId]
		);

		setScriptUrlTag(analyticsScriptUrl, 'async', true)
			.then(() => {
				trackPageView();
				console.info('Analytics load succeeded.');
			})
			.catch((error: unknown) => {
				console.error('Analytics load failed.', error);
			});
	});

	// It has already been tracked once when entering the page for the first time.
	const isLoaded = useRef(true);
	const { pathname } = usePathname();

	useEffect(() => {
		// Avoid tracking repeatedly when first entering the page, only track when the next pathname changes (route change by Next.js).
		if (isLoaded.current) {
			isLoaded.current = false;
			return;
		}

		trackPageView();
	}, [pathname]);

	return null;
}
