import {useEffect} from 'react';
import {Observable, type Subscription, from, merge} from 'rxjs';
import {filter, map, mergeMap} from 'rxjs/operators';
import {UAParser} from 'ua-parser-js';

import {domReady} from '@/utils';

type TFeature = 'flexGap' | 'webp';

export function checkCompatibility() {
	const result: Record<TFeature, boolean> = {
		flexGap: true,
		webp: true,
	};

	const {
		browser: {name: _browserName, version: _browserVersion},
		os: {name: _osName, version: _osVersion},
	} = UAParser();
	const browserName = _browserName?.toLowerCase();
	const browserVersion = _browserVersion && Number.parseInt(_browserVersion, 10);
	const osName = _osName?.toLowerCase();
	const osVersion = _osVersion && Number.parseInt(_osVersion, 10);

	const isChromium =
		browserName?.includes('chromium') || browserName?.includes('chrome') || browserName?.includes('edge');
	const isFirefox = browserName?.includes('firefox');
	const isSafari = browserName?.includes('safari') || osName?.includes('ios');

	const isSupportedFlexGapChromium = browserVersion && browserVersion > 83;
	const isSupportedFlexGapFirefox = browserVersion && browserVersion > 62;
	const isSupportedFlexGapSafari = (browserVersion && browserVersion > 14) || (osVersion && osVersion > 14);
	const isSupportedWebpFirefox = browserVersion && browserVersion > 64;
	const isSupportedWebpSafari = (browserVersion && browserVersion > 15) || (osVersion && osVersion > 15);

	if (isChromium) {
		result.flexGap = Boolean(isSupportedFlexGapChromium);
	} else if (isFirefox) {
		result.flexGap = Boolean(isSupportedFlexGapFirefox);
		result.webp = Boolean(isSupportedWebpFirefox);
	} else if (isSafari) {
		result.flexGap = Boolean(isSupportedFlexGapSafari);
		result.webp = Boolean(isSupportedWebpSafari);
	}

	return result;
}

function getReplacementClass(element: Element, gapClass: string) {
	if (gapClass.includes('gap-x-')) {
		return gapClass.replace('gap-x-', 'space-x-');
	} else if (gapClass.includes('gap-y-')) {
		return gapClass.replace('gap-y-', 'space-y-');
	} else if (gapClass.includes('gap-')) {
		const {classList} = element;

		const isFlexCol = classList.contains('flex-col');
		const isFlexRow = classList.contains('flex-row');
		const isMdFlexRow = classList.contains('md:flex-row');
		const isXlFlexRow = classList.contains('xl:flex-row');
		const isMdFlexCol = classList.contains('md:flex-col');
		const isXlFlexCol = classList.contains('xl:flex-col');

		const isMdSpecific = classList.contains(`md:${gapClass}`);
		const isXlSpecific = classList.contains(`xl:${gapClass}`);
		const isSpecific = isMdSpecific || isXlSpecific;
		const hasPrefix = gapClass.includes(':');

		const prefixRegExp = /((?:md|xl):)?gap-(\S+)/u;

		if (isFlexCol && !isMdFlexRow && !isXlFlexRow) {
			return gapClass.replace('gap-', 'space-y-');
		}
		if (isFlexRow && !isMdFlexCol && !isXlFlexCol) {
			return gapClass.replace('gap-', 'space-x-');
		}
		if (isFlexCol && (isMdFlexRow || isXlFlexRow)) {
			return gapClass.replace(
				prefixRegExp,
				!hasPrefix && !isSpecific
					? `space-y-$2 ${isMdFlexRow ? 'md' : 'xl'}:space-x-$2 ${isMdFlexRow ? 'md' : 'xl'}:space-y-0`
					: hasPrefix
						? '$1space-x-$2 $1space-y-0'
						: 'space-y-$2'
			);
		}
		if (isFlexRow && (isMdFlexCol || isXlFlexCol)) {
			return gapClass.replace(
				prefixRegExp,
				!hasPrefix && !isSpecific
					? `space-x-$2 ${isMdFlexCol ? 'md' : 'xl'}:space-y-$2 ${isMdFlexCol ? 'md' : 'xl'}:space-x-0`
					: hasPrefix
						? '$1space-y-$2 $1space-x-0'
						: 'space-x-$2'
			);
		}

		return gapClass.replace('gap-', 'space-x-');
	}

	return null;
}

function replaceGapClasses(element: Element) {
	if (element.classList.length === 0 || !element.classList.contains('flex')) {
		return;
	}

	[...element.classList]
		.filter((gapClass) => gapClass.includes('gap-') || gapClass.includes('gap-x-') || gapClass.includes('gap-y-'))
		.forEach((gapClass) => {
			const newClass = getReplacementClass(element, gapClass);
			if (newClass) {
				element.classList.add(...newClass.split(' '));
				element.classList.remove(gapClass);
			}
		});
}

function nodeIsElement(node: Node): node is Element {
	return node instanceof Element;
}

function getChildElements(element: Element) {
	return [...element.querySelectorAll('*')].filter(nodeIsElement);
}

function processAllElements(element: Element) {
	replaceGapClasses(element);
	getChildElements(element).forEach(replaceGapClasses);
}

function initFlexGapFix() {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			[...mutation.addedNodes].filter(nodeIsElement).forEach(processAllElements);
		});
	});

	const observer$ = new Observable(() => {
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		return observer.disconnect.bind(observer);
	}).pipe(
		mergeMap(() => from(observer.takeRecords())),
		mergeMap((mutation) => from(mutation.addedNodes)),
		filter(nodeIsElement),
		map(processAllElements)
	);

	const domReady$ = domReady().pipe(
		mergeMap(() => from(getChildElements(document.body))),
		map(replaceGapClasses)
	);

	let subscription: Subscription | undefined;
	requestAnimationFrame(() => {
		subscription = merge(observer$, domReady$).subscribe();
	});

	return subscription;
}

export default function CompatibleBrowser() {
	useEffect(() => {
		if (checkCompatibility()['flexGap']) {
			return;
		}

		const subscription = initFlexGapFix();

		return subscription?.unsubscribe.bind(subscription);
	}, []);

	return null;
}
