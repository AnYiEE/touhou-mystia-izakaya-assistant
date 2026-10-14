const PWA_INSTALL_MODE_DATASET_KEY = 'pwaMode';
const PWA_INSTALL_CHANGE_EVENT = 'pwa-install-change';
// Must match the `Window` declaration in app/declarations/environment.d.ts.
const PWA_DEFERRED_INSTALL_PROMPT_PROPERTY = '__pwaDeferredInstallPrompt';

export {
	PWA_DEFERRED_INSTALL_PROMPT_PROPERTY,
	PWA_INSTALL_CHANGE_EVENT,
	PWA_INSTALL_MODE_DATASET_KEY,
};

const script = (
	deferredPromptProperty: string,
	modeDatasetKey: string,
	changeEventName: string
) => {
	try {
		const root = document.documentElement;
		const globalScope = globalThis as unknown as Record<string, unknown>;
		const checkInstalled = () => {
			const installedDisplayModes = [
				'standalone',
				'fullscreen',
				'minimal-ui',
			];
			for (const displayMode of installedDisplayModes) {
				if (
					globalThis.matchMedia(`(display-mode: ${displayMode})`)
						.matches
				) {
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
		};
		const dispatchChange = () => {
			globalThis.dispatchEvent(new Event(changeEventName));
		};

		if (checkInstalled()) {
			root.dataset[modeDatasetKey] = 'installed';
		}

		globalThis.addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			globalScope[deferredPromptProperty] = event;
			if (!checkInstalled()) {
				root.dataset[modeDatasetKey] = 'promptable';
			}
			dispatchChange();
		});

		globalThis.addEventListener('appinstalled', () => {
			globalScope[deferredPromptProperty] = undefined;
			root.dataset[modeDatasetKey] = 'installed';
			dispatchChange();
		});
	} catch (error) {
		console.error('[features/pwa/client/installScript]:', error);
	}
};

export default function InstallScript() {
	const scriptArgs = JSON.stringify([
		PWA_DEFERRED_INSTALL_PROMPT_PROPERTY,
		PWA_INSTALL_MODE_DATASET_KEY,
		PWA_INSTALL_CHANGE_EVENT,
	]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs})`,
			}}
		/>
	);
}
