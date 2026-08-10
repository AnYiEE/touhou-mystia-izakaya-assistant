import { compareVersions, validate } from 'compare-versions';
import { UAParser } from 'ua-parser-js';

import { memoize } from '@/shared/utilities/cache/memoize';

type TFeature = 'flexGap' | 'largeSlidingPanelAnimation';
type TCompatibility = Record<TFeature, boolean>;

function isVersionAtLeast(version: string | undefined, minimumVersion: string) {
	return (
		version !== undefined &&
		validate(version) &&
		compareVersions(version, minimumVersion) >= 0
	);
}

function isVersionLessThan(
	version: string | undefined,
	maximumVersion: string
) {
	return (
		version !== undefined &&
		validate(version) &&
		compareVersions(version, maximumVersion) < 0
	);
}

export const checkCompatibility = memoize(function checkCompatibility() {
	const compatibility: TCompatibility = {
		flexGap: true,
		largeSlidingPanelAnimation: true,
	};

	const {
		browser: { name: _browserName, version: browserVersion },
		os: { name: _osName, version: osVersion },
	} = UAParser();
	const browserName = (_browserName ?? '').toLowerCase();
	const osName = (_osName ?? '').toLowerCase();

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
		osName.includes('ios') && isVersionLessThan(osVersion, '17');

	compatibility.largeSlidingPanelAnimation =
		!isIOS16OrEarlier && !isIPadOSDesktopMode;

	const isSupportedFlexGapChromium = isVersionAtLeast(browserVersion, '84');
	const isSupportedFlexGapFirefox = isVersionAtLeast(browserVersion, '63');
	const isSupportedFlexGapSafari =
		isVersionAtLeast(browserVersion, '14.1') ||
		(osName.includes('ios') && isVersionAtLeast(osVersion, '14.5'));

	if (isChromium) {
		compatibility.flexGap = isSupportedFlexGapChromium;
	} else if (isFirefox) {
		compatibility.flexGap = isSupportedFlexGapFirefox;
	} else if (isSafari) {
		compatibility.flexGap = isSupportedFlexGapSafari;
	}

	return compatibility;
});
