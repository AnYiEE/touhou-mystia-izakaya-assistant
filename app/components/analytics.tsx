'use client';

import { useEffect, useRef } from 'react';

import { useMounted, usePathname } from '@/hooks';

import { siteConfig } from '@/configs';
import { globalStore as store } from '@/stores';
import { setScriptUrlTag } from '@/utilities';

const { analyticsApiUrl, analyticsScriptUrl, analyticsSiteId, baseURL } =
	siteConfig;

function push(...args: unknown[][]) {
	globalThis._paq ??= [];
	globalThis._paq.push(...args);
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

type TError = 'Cloud' | 'Global' | 'Update';
type TShow = 'Popover' | 'Tooltip';

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
	action: TItem | TItemAlone,
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
	action: TActions | TError | TItem | TItemAlone | TItemCard | TShow,
	name: string,
	value?: number | string
) {
	push(
		['setCustomUrl', location.href],
		['setDocumentTitle', document.title],
		['trackEvent', category, action, name, value]
	);
	store.persistence.donationModal.interactionCount.set((count) => {
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
			['setSiteId', analyticsSiteId],
			['setUserId', store.persistence.userId.get()]
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
