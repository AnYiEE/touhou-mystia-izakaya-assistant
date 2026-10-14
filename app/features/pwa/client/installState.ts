import { UAParser } from 'ua-parser-js';

import { checkIsApplePlatform } from '@/infrastructure/browser/capabilities/platform';

import { PWA_INSTALL_MODE_DATASET_KEY } from './installScript';

export type TPwaInstallMode =
	| 'in-app'
	| 'installed'
	| 'manual-firefox'
	| 'manual-ios-other'
	| 'manual-ios-safari'
	| 'manual-safari-macos'
	| 'promptable'
	| 'unknown';

export type TPwaInstallPromptOutcome = 'accepted' | 'dismissed' | 'timeout';

const INSTALL_PROMPT_TIMEOUT_MS = 1500;

const INSTALLED_DISPLAY_MODES = ['fullscreen', 'minimal-ui', 'standalone'];

const IN_APP_BROWSER_MARKERS = [
	'aweme', // Douyin
	'bytedancewebview',
	'douyin',
	'micromessenger', // WeChat
	' qq/', // QQ in-app webview
	'weibo',
];

function checkInstalledDisplayMode() {
	if (
		document.documentElement.dataset[PWA_INSTALL_MODE_DATASET_KEY] ===
		'installed'
	) {
		return true;
	}

	for (const displayMode of INSTALLED_DISPLAY_MODES) {
		if (globalThis.matchMedia(`(display-mode: ${displayMode})`).matches) {
			return true;
		}
	}

	const navigatorValue = globalThis.navigator as Navigator & {
		standalone?: boolean;
	};

	return (
		navigatorValue.standalone === true ||
		document.referrer.startsWith('android-app://')
	);
}

export function readDeferredInstallPrompt() {
	return typeof navigator === 'undefined'
		? undefined
		: globalThis.__pwaDeferredInstallPrompt;
}

export function computePwaInstallMode(): TPwaInstallMode {
	if (typeof navigator === 'undefined') {
		return 'unknown';
	}
	if (checkInstalledDisplayMode()) {
		return 'installed';
	}
	if (readDeferredInstallPrompt() !== undefined) {
		return 'promptable';
	}

	const { maxTouchPoints, platform, userAgent } = navigator;
	const userAgentLower = userAgent.toLowerCase();
	if (
		IN_APP_BROWSER_MARKERS.some((marker) => userAgentLower.includes(marker))
	) {
		return 'in-app';
	}

	const { browser, os } = UAParser(userAgent);
	const browserName = (browser.name ?? '').toLowerCase();
	const osName = (os.name ?? '').toLowerCase();

	// iPadOS desktop mode reports the same platform string as macOS while
	// exposing touch points, so treat it as iOS.
	const isIPadDesktopMode = platform === 'MacIntel' && maxTouchPoints > 1;
	if (osName === 'ios' || isIPadDesktopMode) {
		return browserName.includes('safari')
			? 'manual-ios-safari'
			: 'manual-ios-other';
	}
	if (browserName.includes('firefox')) {
		return 'manual-firefox';
	}
	if (
		checkIsApplePlatform() &&
		osName.includes('mac') &&
		browserName.includes('safari')
	) {
		return 'manual-safari-macos';
	}

	return 'unknown';
}

function resolveInstallPromptOutcome(
	choice: Promise<IPwaDeferredInstallPromptUserChoice> | undefined
) {
	return new Promise<TPwaInstallPromptOutcome>((resolve) => {
		const timer = setTimeout(() => {
			resolve('timeout');
		}, INSTALL_PROMPT_TIMEOUT_MS);
		if (choice === undefined) {
			return;
		}

		choice.then(
			(result) => {
				clearTimeout(timer);
				resolve(result.outcome);
			},
			() => {
				clearTimeout(timer);
				resolve('timeout');
			}
		);
	});
}

export function promptInstall() {
	const event = readDeferredInstallPrompt();
	if (event === undefined) {
		return null;
	}

	let choice: Promise<IPwaDeferredInstallPromptUserChoice> | undefined;
	try {
		// `prompt()` must be called synchronously inside the user gesture.
		choice = event.prompt() ?? event.userChoice;
	} catch {
		// A consumed or invalid prompt cannot be shown again; fall back to
		// the manual steps.
		return null;
	}

	return { outcome: resolveInstallPromptOutcome(choice) };
}
