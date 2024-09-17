'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {siteConfig} from '@/configs';
import {setScriptUrlTag} from '@/utils';

const {domain} = siteConfig;

const trackerBaseUrl = `https://track.${domain}`;
const siteId = 11;

function push(...args: unknown[][]) {
	window._paq ??= [];
	window._paq.push(...args);
}

export enum TrackCategory {
	Click = 'Click',
	Error = 'Error',
	Select = 'Select',
	Unselect = 'Unselect',
}

type TAction = 'Import' | 'Remove' | 'Reset' | 'Save' | 'Select';
type TActionButton = `${TAction} Button`;
type TError = 'Global' | 'Sync';
type TItem = 'Beverage' | 'Cooker' | 'Ingredient' | 'Recipe';
type TItemCard = `${TItem} Card`;
type TItemAlone = 'Customer' | 'Customer Tag' | 'MystiaCooker';

export function trackEvent(
	category: TrackCategory.Click,
	action: TActionButton | TItemCard,
	name?: string,
	value?: number | string
): void;
export function trackEvent(category: TrackCategory.Error, action: TError, name: string, value?: number | string): void;
export function trackEvent(
	category: TrackCategory.Select | TrackCategory.Unselect,
	action: TItem | TItemAlone,
	name?: string,
	value?: number | string
): void;
export function trackEvent(
	category: keyof typeof TrackCategory,
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

function trackPageView() {
	push(['setCustomUrl', location.href], ['setDocumentTitle', document.title], ['trackPageView']);
}

export default function Analytics() {
	const pathname = usePathname();
	const isLoaded = useRef(true);

	useEffect(() => {
		if (window._paq) {
			trackPageView();
			return;
		}

		push(
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

		return subscription.unsubscribe.bind(subscription);
	}, []);

	useEffect(() => {
		if (isLoaded.current) {
			isLoaded.current = false;
			return;
		}

		trackPageView();
	}, [pathname]);

	return null;
}
