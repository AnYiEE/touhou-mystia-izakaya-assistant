'use client';

import {useEffect} from 'react';
import {UAParser} from 'ua-parser-js';

import {checkDomReady, checkEmpty, memoize, toArray} from '@/utilities';

type TFeature = 'flexGap' | 'webp';
type TCompatibility = Record<TFeature, boolean>;

export const checkCompatibility = memoize(function checkCompatibility() {
	const compatibility: TCompatibility = {
		flexGap: true,
		webp: true,
	};

	const {
		browser: {name: _browserName, version: _browserVersion},
		os: {name: _osName, version: _osVersion},
	} = UAParser();
	const browserName = (_browserName ?? '').toLowerCase();
	const browserVersion = _browserVersion !== undefined && Number.parseInt(_browserVersion);
	const osName = (_osName ?? '').toLowerCase();
	const osVersion = _osVersion !== undefined && Number.parseInt(_osVersion);

	const isChromium =
		browserName.includes('chromium') || browserName.includes('chrome') || browserName.includes('edge');
	const isFirefox = browserName.includes('firefox');
	const isSafari = browserName.includes('safari') || osName.includes('ios');

	const isSupportedFlexGapChromium = typeof browserVersion === 'number' && browserVersion > 83;
	const isSupportedFlexGapFirefox = typeof browserVersion === 'number' && browserVersion > 62;
	const isSupportedFlexGapSafari =
		(typeof browserVersion === 'number' && browserVersion > 14) ||
		(typeof osVersion === 'number' && osVersion > 14);
	const isSupportedWebpFirefox = typeof browserVersion === 'number' && browserVersion > 64;
	const isSupportedWebpSafari =
		(typeof browserVersion === 'number' && browserVersion > 15) ||
		(typeof osVersion === 'number' && osVersion > 15);

	if (isChromium) {
		compatibility.flexGap = Boolean(isSupportedFlexGapChromium);
	} else if (isFirefox) {
		compatibility.flexGap = Boolean(isSupportedFlexGapFirefox);
		compatibility.webp = Boolean(isSupportedWebpFirefox);
	} else if (isSafari) {
		compatibility.flexGap = Boolean(isSupportedFlexGapSafari);
		compatibility.webp = Boolean(isSupportedWebpSafari);
	}

	return compatibility;
});

function getReplacementClass(element: Element, gapClass: string) {
	if (gapClass.includes('gap-x-')) {
		return gapClass.replace('gap-x-', 'space-x-');
	} else if (gapClass.includes('gap-y-')) {
		return gapClass.replace('gap-y-', 'space-y-');
	} else if (gapClass.includes('gap-')) {
		const {classList} = element;

		const isFlexCol = classList.contains('flex-col');
		const isFlexRow = classList.contains('flex-row');
		const isMdFlexCol = classList.contains('md:flex-col');
		const isLgFlexCol = classList.contains('lg:flex-col');
		const isXlFlexCol = classList.contains('xl:flex-col');
		const isMdFlexRow = classList.contains('md:flex-row');
		const isLgFlexRow = classList.contains('lg:flex-row');
		const isXlFlexRow = classList.contains('xl:flex-row');

		const isMdSpecify = classList.contains(`md:${gapClass}`);
		const isLgSpecify = classList.contains(`lg:${gapClass}`);
		const isXlSpecify = classList.contains(`xl:${gapClass}`);
		const isSpecify = isMdSpecify || isLgSpecify || isXlSpecify;
		const hasPrefix = gapClass.includes(':');

		const prefixRegExp = /((?:md|lg|xl):)?gap-(\S+)/u;

		if (isFlexCol && !isMdFlexRow && !isLgFlexRow && !isXlFlexRow) {
			return gapClass.replace('gap-', 'space-y-');
		}
		if (isFlexRow && !isMdFlexCol && !isLgFlexCol && !isXlFlexCol) {
			return gapClass.replace('gap-', 'space-x-');
		}
		if (isFlexCol && (isMdFlexRow || isLgFlexRow || isXlFlexRow)) {
			const prefix = isMdFlexRow ? 'md' : isLgFlexRow ? 'lg' : 'xl';
			return gapClass.replace(
				prefixRegExp,
				!hasPrefix && !isSpecify
					? `space-y-$2 ${prefix}:space-x-$2 ${prefix}:space-y-0`
					: hasPrefix
						? '$1space-x-$2 $1space-y-0'
						: 'space-y-$2'
			);
		}
		if (isFlexRow && (isMdFlexCol || isLgFlexCol || isXlFlexCol)) {
			const prefix = isMdFlexCol ? 'md' : isLgFlexCol ? 'lg' : 'xl';
			return gapClass.replace(
				prefixRegExp,
				!hasPrefix && !isSpecify
					? `space-x-$2 ${prefix}:space-y-$2 ${prefix}:space-x-0`
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
	if (
		checkEmpty(element.classList) ||
		(!(element.classList.contains('flex') || element.classList.contains('inline-flex')) &&
			!(element.classList.contains('md:flex') || element.classList.contains('md:inline-flex')) &&
			!(element.classList.contains('lg:flex') || element.classList.contains('lg:inline-flex')) &&
			!(element.classList.contains('xl:flex') || element.classList.contains('xl:inline-flex')))
	) {
		return;
	}

	toArray(element.classList)
		.filter((gapClass) => gapClass.includes('gap-'))
		.forEach((gapClass) => {
			const newClass = getReplacementClass(element, gapClass);
			if (newClass) {
				element.classList.add(...newClass.split(' '));
				element.classList.remove(gapClass);
			}
		});
}

function nodeIsElement(node: Node) {
	return node instanceof Element;
}

function getChildElements(element: Element) {
	return toArray(element.querySelectorAll('*')).filter(nodeIsElement);
}

function processAllElements(element: Element) {
	replaceGapClasses(element);
	getChildElements(element).forEach(replaceGapClasses);
}

function processMutations(mutations: MutationRecord[]) {
	mutations.forEach((mutation) => {
		toArray(mutation.addedNodes).filter(nodeIsElement).forEach(processAllElements);
	});
}

function initFlexGapFix() {
	void checkDomReady().then(() => {
		getChildElements(document.body).forEach(replaceGapClasses);
	});

	const observer = new MutationObserver(processMutations);

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	return observer;
}

export default function CompatibleBrowser() {
	useEffect(() => {
		if (checkCompatibility().flexGap) {
			return;
		}

		const observer = initFlexGapFix();

		return () => {
			processMutations(observer.takeRecords());
			observer.disconnect();
		};
	}, []);

	return null;
}
