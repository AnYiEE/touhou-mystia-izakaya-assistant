import { UAParser } from 'ua-parser-js';

import { memoize } from '@/shared/utilities/cache/memoize';

type TFeature = 'flexGap' | 'largeSlidingPanelAnimation';
type TCompatibility = Record<TFeature, boolean>;

export const checkCompatibility = memoize(function checkCompatibility() {
	const compatibility: TCompatibility = {
		flexGap: true,
		largeSlidingPanelAnimation: true,
	};

	const {
		browser: { name: _browserName, version: _browserVersion },
		os: { name: _osName, version: _osVersion },
	} = UAParser();
	const browserName = (_browserName ?? '').toLowerCase();
	const browserVersion =
		_browserVersion !== undefined && Number.parseInt(_browserVersion);
	const osName = (_osName ?? '').toLowerCase();
	const osVersion = _osVersion !== undefined && Number.parseInt(_osVersion);

	const isChromium =
		browserName.includes('chromium') ||
		browserName.includes('chrome') ||
		browserName.includes('edge');
	const isFirefox = browserName.includes('firefox');
	const isSafari = browserName.includes('safari') || osName.includes('ios');
	// iPadOS desktop mode identifies itself as macOS and does not expose a
	// reliable OS version, so prefer the static large-panel fallback.
	const isIPadOSDesktopMode =
		typeof navigator !== 'undefined' &&
		navigator.platform === 'MacIntel' &&
		// eslint-disable-next-line compat/compat -- Progressive enhancement for iPadOS desktop-mode detection.
		navigator.maxTouchPoints > 1;
	const isIOS16OrEarlier =
		osName.includes('ios') &&
		typeof osVersion === 'number' &&
		osVersion <= 16;

	compatibility.largeSlidingPanelAnimation =
		!isIOS16OrEarlier && !isIPadOSDesktopMode;

	const isSupportedFlexGapChromium =
		typeof browserVersion === 'number' && browserVersion > 83;
	const isSupportedFlexGapFirefox =
		typeof browserVersion === 'number' && browserVersion > 62;
	const isSupportedFlexGapSafari =
		(typeof browserVersion === 'number' && browserVersion > 14) ||
		(typeof osVersion === 'number' && osVersion > 14);

	if (isChromium) {
		compatibility.flexGap = isSupportedFlexGapChromium;
	} else if (isFirefox) {
		compatibility.flexGap = isSupportedFlexGapFirefox;
	} else if (isSafari) {
		compatibility.flexGap = isSupportedFlexGapSafari;
	}

	return compatibility;
});
