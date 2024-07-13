'use client';

import {memo, useEffect, useRef} from 'react';

import {usePathname} from 'next/navigation';

import {siteConfig} from '@/configs';
import {setScriptUrlTag} from '@/utils';

const {domain} = siteConfig;

// cSpell:ignore sukiu
const trackerBaseUrl = '//track.sukiu.net';
const siteId = 11;

export enum TrackCategory {
	Click = 'Click',
	Select = 'Select',
	Unselect = 'Unselect',
}

type TAction = 'Import' | 'Remove' | 'Reset' | 'Save' | 'Select';
type TFood = 'Beverage' | 'Ingredient' | 'Recipe';

export function trackEvent(
	category: TrackCategory.Click,
	action: `${TAction} Button` | `${TFood} Card`,
	name?: string,
	value?: number | string
): void;
export function trackEvent(
	category: TrackCategory.Select | TrackCategory.Unselect,
	action: 'Customer' | 'Customer Tag' | TFood,
	name?: string,
	value?: number | string
): void;
export function trackEvent(
	category: keyof typeof TrackCategory,
	action: `${TAction} Button` | `${TFood} Card` | 'Customer' | 'Customer Tag' | TFood,
	name?: string,
	value?: number | string
) {
	window._paq ??= [] as unknown as NonNullable<Window['_paq']>;
	window._paq.push(
		['setCustomUrl', location.href],
		['setDocumentTitle', document.title],
		['trackEvent', category, action, name, value]
	);
}

function trackPageView() {
	window._paq ??= [] as unknown as NonNullable<Window['_paq']>;
	window._paq.push(['setCustomUrl', location.href], ['setDocumentTitle', document.title], ['trackPageView']);
}

export default memo(function Analytics() {
	const pathname = usePathname();
	const isLoaded = useRef(true);

	useEffect(() => {
		if (window._paq) {
			trackPageView();
			return;
		}

		window._paq ??= [] as unknown as NonNullable<Window['_paq']>;
		window._paq.push(
			['enableHeartBeatTimer'],
			['enableLinkTracking'],
			['setCookieDomain', `*.${domain}`],
			['setDomains', [`*.${domain}`]],
			['setTrackerUrl', `${trackerBaseUrl}/track.php`],
			['setSecureCookie', true],
			['setSiteId', siteId.toString()]
		);

		setScriptUrlTag('/track.js', 'async', true)
			.then(() => {
				console.info('Analytics load succeeded.');
				trackPageView();
			})
			.catch(() => {
				console.info('Analytics load failed.');
			});
	}, []);

	useEffect(() => {
		if (isLoaded.current) {
			isLoaded.current = false;
			return;
		}

		trackPageView();
	}, [pathname]);

	return null;
});
