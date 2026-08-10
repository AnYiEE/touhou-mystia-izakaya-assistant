'use client';

import { useEffect } from 'react';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';
import { waitDomReady } from '@/infrastructure/browser/dom/waitDomReady';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

function getReplacementClass(element: Element, gapClass: string) {
	if (gapClass.includes('gap-x-')) {
		return gapClass.replace('gap-x-', 'space-x-');
	} else if (gapClass.includes('gap-y-')) {
		return gapClass.replace('gap-y-', 'space-y-');
	} else if (gapClass.includes('gap-')) {
		const { classList } = element;

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
		checkLengthEmpty(element.classList) ||
		(!(
			element.classList.contains('flex') ||
			element.classList.contains('inline-flex')
		) &&
			!(
				element.classList.contains('md:flex') ||
				element.classList.contains('md:inline-flex')
			) &&
			!(
				element.classList.contains('lg:flex') ||
				element.classList.contains('lg:inline-flex')
			) &&
			!(
				element.classList.contains('xl:flex') ||
				element.classList.contains('xl:inline-flex')
			))
	) {
		return;
	}

	for (const gapClass of [...element.classList]
		.values()
		.filter((className) => className.includes('gap-'))) {
		const newClass = getReplacementClass(element, gapClass);
		if (newClass) {
			element.classList.add(...newClass.split(' '));
			element.classList.remove(gapClass);
		}
	}
}

function nodeIsElement(node: Node) {
	return node instanceof Element;
}

function getChildElements(element: Element) {
	return [...element.querySelectorAll('*')];
}

function processAllElements(element: Element) {
	replaceGapClasses(element);
	getChildElements(element).forEach(replaceGapClasses);
}

function processMutations(mutations: MutationRecord[]) {
	mutations.forEach((mutation) => {
		for (const node of [...mutation.addedNodes]
			.values()
			.filter(nodeIsElement)) {
			processAllElements(node);
		}
	});
}

function initFlexGapFix() {
	void waitDomReady().then(() => {
		getChildElements(document.body).forEach(replaceGapClasses);
	});

	const observer = new MutationObserver(processMutations);

	observer.observe(document.body, { childList: true, subtree: true });

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
