/* eslint-disable func-names, no-var, prefer-arrow-callback, vars-on-top, unicorn/prefer-includes */
var VERSION = 'offline/{{version}}';

var networkErrorResponse = new Response('A network error occurred, but no cached resources were found.', {
	headers: {
		'Content-Type': 'text/plain',
	},
	status: 418,
});

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

function fetchAndCache(request) {
	return fetch(request).then(function (response) {
		putInCache(request, response.clone(), VERSION);
		return response;
	});
}

function cacheFirst(request) {
	return caches.match(request).then(function (responseFromCache) {
		if (responseFromCache) {
			return responseFromCache;
		}
		return fetchAndCache(request)['catch'](function () {
			return networkErrorResponse.clone();
		});
	});
}

function networkFirst(request) {
	return fetchAndCache(request)['catch'](function () {
		return caches.match(request).then(function (responseFromCache) {
			if (responseFromCache) {
				return responseFromCache;
			}
			return networkErrorResponse.clone();
		});
	});
}

self.addEventListener('install', function (event) {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
	event.waitUntil(Promise.all([self.clients.claim(), deleteOldCaches()]));
});

self.addEventListener('fetch', function (event) {
	if (event.request.headers.has('range') || event.request.method !== 'GET') {
		return;
	}

	var urlObject = new URL(event.request.url, location.origin);
	if (urlObject.host !== location.host || urlObject.protocol !== 'https:') {
		return;
	}
	if (urlObject.pathname.startsWith('/_vercel')) {
		return;
	}

	if (urlObject.pathname.indexOf('.') === -1) {
		event.respondWith(networkFirst(event.request));
	} else {
		event.respondWith(cacheFirst(event.request));
	}
});
