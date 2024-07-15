import {useEffect} from 'react';
import {UAParser} from 'ua-parser-js';

import {domReady} from '@/utils';

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

		// eslint-disable-next-line require-unicode-regexp
		const prefixRegExp = /((?:md|xl):)?gap-(\S+)/;

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

	const gapClasses = [...element.classList].filter(
		(gapClass) => gapClass.includes('gap-') || gapClass.includes('gap-x-') || gapClass.includes('gap-y-')
	);

	for (const gapClass of gapClasses) {
		const newClass = getReplacementClass(element, gapClass);
		if (newClass) {
			element.classList.add(...newClass.split(' '));
			element.classList.remove(gapClass);
		}
	}
}

export default function CompatibleSafari() {
	useEffect(() => {
		const {
			browser: {name, version},
		} = UAParser();

		const isSafari = name?.toLowerCase().includes('safari');
		if (!isSafari) {
			return;
		}

		const isSupportedFlexGapVersion = version && Number.parseInt(version) > 14;
		if (isSupportedFlexGapVersion) {
			return;
		}

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.nodeType === 1) {
						const element = node as Element;

						replaceGapClasses(element);

						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						if (element.querySelectorAll) {
							for (const child of element.querySelectorAll('*')) {
								replaceGapClasses(child);
							}
						}
					}
				}
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		void domReady().then(() => {
			for (const element of document.body.querySelectorAll('*')) {
				replaceGapClasses(element);
			}
		});
	}, []);

	return null;
}
