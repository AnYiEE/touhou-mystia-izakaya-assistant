'use client';

import {memo, useEffect, useRef} from 'react';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {usePathname} from 'next/navigation';

import {siteConfig} from '@/configs';
import {setScriptUrlTag} from '@/utils';

const {domain} = siteConfig;

const trackerBaseUrl = 'https://track.izakaya.cc';
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
			['setRequestMethod', 'GET'],
			['setTrackerUrl', `${trackerBaseUrl}/api.php`],
			['setSecureCookie', true],
			['setSiteId', siteId.toString()]
		);

		const subscription = setScriptUrlTag(`${trackerBaseUrl}/api.js`, 'async', true)
			.pipe(
				catchError((error) => {
					console.info('Analytics load failed.', error);
					return of(false);
				})
			)
			.subscribe((isSuccess) => {
				if (isSuccess) {
					console.info('Analytics load succeeded.');
					trackPageView();
				}
			});

		return () => {
			subscription.unsubscribe();
		};
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
