/* eslint-disable func-names, prefer-arrow-callback, unicorn/prefer-top-level-await */
if (Reflect.has(navigator, 'serviceWorker') && Reflect.has(self, 'caches')) {
	navigator.serviceWorker
		.register('/serviceWorker.js?v={{version}}')
		.then(function (registration) {
			if (registration.installing) {
				console.info('ServiceWorker is installing.');
			} else if (registration.waiting) {
				console.info('ServiceWorker is waiting.');
			} else if (registration.active) {
				console.info('ServiceWorker actived.');
			}
		})
		['catch'](function (error) {
			console.error('ServiceWorker register error:', error);
		});
}
