// @ts-check
/* eslint-disable unicorn/prefer-module, unicorn/prefer-top-level-await */
'use strict';

(async function registerServiceWorker() {
	if (!('serviceWorker' in navigator) || !('caches' in globalThis)) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.register('/serviceWorker.js?v={{version}}');
		if (registration.installing) {
			console.info('ServiceWorker is installing.');
		} else if (registration.waiting) {
			console.info('ServiceWorker is waiting.');
		} else if (registration.active) {
			console.info('ServiceWorker activated.');
		}
	} catch (error) {
		console.error('ServiceWorker register error:', error);
	}
})();
