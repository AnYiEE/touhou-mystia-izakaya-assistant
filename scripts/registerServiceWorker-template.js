/* eslint-disable func-names, prefer-arrow-callback, unicorn/prefer-top-level-await */
if (Reflect.has(navigator, 'serviceWorker') && Reflect.has(self, 'caches')) {
	navigator.serviceWorker
		.register('/serviceWorker.js?v={{version}}')
		.then(function (registration) {
			if (registration.installing) {
				console.log('ServiceWorker is installing.');
			} else if (registration.waiting) {
				console.log('ServiceWorker is waiting.');
			} else if (registration.active) {
				console.log('ServiceWorker actived.');
			}
		})
		['catch'](function (error) {
			console.error('ServiceWorker register error:', error);
		});
}
