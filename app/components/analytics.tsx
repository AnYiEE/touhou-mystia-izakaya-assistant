'use client';

import { useEffect, useRef } from 'react';

import { useMounted, usePathname } from '@/hooks';

import { siteConfig } from '@/configs';
import { accountStore, globalStore } from '@/stores';
import { setScriptUrlTag } from '@/utilities';

const { analyticsApiUrl, analyticsScriptUrl, analyticsSiteId, baseURL } =
	siteConfig;

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

function setAnalyticsUserId() {
	const userId = getAnalyticsUserId();
	if (userId === null) {
		push(['resetUserId']);
		return;
	}

	push(['setUserId', userId]);
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
	| 'Account Sync'
	| 'Admin Auth'
	| 'Admin User Action'
	| 'Admin User Detail'
	| 'Cloud Delete'
	| 'Cloud Download'
	| 'Cloud Upload'
	| 'Donation Modal'
	| 'Error'
	| 'Export'
	| 'Import'
	| 'Info'
	| 'OpenWindow'
	| 'PIP'
	| 'Remove'
	| 'Reset'
	| 'Save'
	| 'Share'
	| 'Select'
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

type TError = 'Cloud' | 'Global' | 'Update';
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
	push(
		['setCustomUrl', location.href],
		['setDocumentTitle', document.title],
		['trackEvent', category, action, name, value]
	);
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
	push(
		['setCustomUrl', location.href],
		['setDocumentTitle', document.title],
		['trackPageView']
	);
}

export function ping() {
	push(['ping']);
}

export default function Analytics() {
	useMounted(() => {
		// The tracker has been initialized, skip.
		if (globalThis._paq !== undefined) {
			return;
		}

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
		setAnalyticsUserId();

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

	const isLoggedIn = accountStore.shared.isLoggedIn.use();
	const user = accountStore.shared.user.use();
	const fingerprintUserId = globalStore.persistence.userId.use();
	const analyticsUserId = isLoggedIn ? (user?.id ?? null) : fingerprintUserId;

	const isUserIdInitialized = useRef(false);

	useEffect(() => {
		if (globalThis._paq === undefined) {
			return;
		}

		if (!isUserIdInitialized.current) {
			isUserIdInitialized.current = true;
			return;
		}

		if (analyticsUserId === null) {
			push(['resetUserId']);
			return;
		}

		push(['setUserId', analyticsUserId]);
	}, [analyticsUserId]);

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
