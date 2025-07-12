'use client';

import {useEffect, useRef} from 'react';

import {useMounted, usePathname} from '@/hooks';

import {siteConfig} from '@/configs';
import {globalStore as store} from '@/stores';
import {setScriptUrlTag} from '@/utilities';

const {analyticsApiUrl, analyticsScriptUrl, analyticsSiteId, domain} = siteConfig;

function push(...args: unknown[][]) {
	globalThis._paq ??= [];
	globalThis._paq.push(...args);
}

const trackCategoryMap = {
	click: 'Click',
	error: 'Error',
	select: 'Select',
	unselect: 'Unselect',
} as const;

type TTrackCategory = ExtractCollectionValue<typeof trackCategoryMap>;

type TAction =
	| 'Cloud Delete'
	| 'Cloud Download'
	| 'Cloud Upload'
	| 'Export'
	| 'Import'
	| 'Info'
	| 'Remove'
	| 'Reset'
	| 'Save'
	| 'Select';
type TActionButton = `${TAction} Button`;
type TError = 'Cloud' | 'Global';
type TItem = 'Beverage' | 'Clothes' | 'Cooker' | 'Currency' | 'Ingredient' | 'Ornament' | 'Partner' | 'Recipe';
type TItemCard = `${TItem} Card`;
type TItemAlone = 'Customer' | 'Customer Tag' | 'MystiaCooker';

function trackEventFunction(
	category: typeof trackCategoryMap.click,
	action: TActionButton | TItemCard,
	name?: string,
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
	name?: string,
	value?: number | string
): void;
function trackEventFunction(
	category: TTrackCategory,
	action: TAction | TActionButton | TError | TItem | TItemCard | TItemAlone,
	name?: string,
	value?: number | string
) {
	push(
		['setCustomUrl', location.href],
		['setDocumentTitle', document.title],
		['trackEvent', category, action, name, value]
	);
}

export const trackEvent = trackEventFunction as typeof trackEventFunction & {
	category: typeof trackCategoryMap;
};

trackEvent.category = trackCategoryMap;

function trackPageView() {
	push(['setCustomUrl', location.href], ['setDocumentTitle', document.title], ['trackPageView']);
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
			['setCookieDomain', `*.${domain}`],
			['setDomains', [`*.${domain}`]],
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
	const pathname = usePathname();

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
