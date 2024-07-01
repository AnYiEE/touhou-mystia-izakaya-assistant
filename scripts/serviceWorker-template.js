/* eslint-disable func-names, no-var, prefer-arrow-callback, vars-on-top */
var VERSION = 'offline/{{version}}';

function deleteCache(key) {
	return caches['delete'](key);
}

function deleteOldCaches() {
	return caches.keys().then(function (keyArray) {
		var cachesToDelete = keyArray.filter(function (key) {
			return key !== VERSION;
		});
		return Promise.all(
			cachesToDelete.map(function (key) {
				return deleteCache(key);
			})
		);
	});
}

function putInCache(request, response, version) {
	return caches.open(version).then(function (cache) {
		return cache.put(request, response);
	});
}

function networkFirst(request) {
	return fetch(request)
		.then(function (responseFromNetwork) {
			putInCache(request, responseFromNetwork.clone(), VERSION);
			return responseFromNetwork;
		})
		['catch'](function () {
			return caches.match(request).then(function (responseFromCache) {
				if (responseFromCache) {
					return responseFromCache;
				}
				return new Response('A network error occurred, but no cached resources were found.', {
					headers: {
						'Content-Type': 'text/plain',
					},
					status: 418,
				});
			});
		});
}

self.addEventListener('activate', function (event) {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('install', function (event) {
	event.waitUntil(Promise.all([deleteOldCaches(), self.skipWaiting()]));
});

self.addEventListener('fetch', function (event) {
	if (event.request.headers.has('range') || event.request.method !== 'GET') {
		return;
	}
	var urlObject = new URL(event.request.url, location.origin);
	if (urlObject.host !== location.host || urlObject.protocol !== 'https:') {
		return;
	}
	event.respondWith(networkFirst(event.request));
});
