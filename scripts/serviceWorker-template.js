// @ts-check
/* eslint-disable unicorn/prefer-module */
'use strict';

const VERSION = 'offline/{{version}}';

const networkErrorResponse = new Response('A network error occurred, but no cached resources were found.', {
	headers: {
		'Content-Type': 'text/plain',
	},
	status: 418,
});

function delay(/** @type {number} */ ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function deleteCache(/** @type {string} */ key) {
	await caches.delete(key);
}

async function deleteOldCaches() {
	const keyArray = await caches.keys();
	const cachesToDelete = keyArray.filter((key) => key !== VERSION);

	await Promise.all(cachesToDelete.map(deleteCache));
}

async function putInCache(
	/** @type {Request} */ request,
	/** @type {Response} */ response,
	/** @type {string} */ version
) {
	const cache = await caches.open(version);

	await cache.put(request, response);
}

async function fetchAndCache(/** @type {Request} */ request) {
	const response = await fetch(request);

	void putInCache(request, response.clone(), VERSION);

	return response;
}

async function fetchWithRetry(/** @type {Request} */ request, /** @type {number} */ retries) {
	try {
		return await fetchAndCache(request);
	} catch (error) {
		if (retries > 1) {
			await delay(1000);
			return fetchWithRetry(request, retries - 1);
		}
		throw error;
	}
}

async function cacheFirst(/** @type {Request} */ request) {
	const responseFromCache = await caches.match(request);
	if (responseFromCache) {
		return responseFromCache;
	}

	try {
		return await fetchWithRetry(request, 3);
	} catch {
		return networkErrorResponse.clone();
	}
}

async function networkFirst(/** @type {Request} */ request) {
	try {
		return await fetchWithRetry(request, 3);
	} catch {
		const responseFromCache = await caches.match(request);
		if (responseFromCache) {
			return responseFromCache;
		}
		return networkErrorResponse.clone();
	}
}

self.addEventListener('install', (/** @type {ExtendableEvent} */ event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (/** @type {ExtendableEvent} */ event) => {
	event.waitUntil(Promise.all([self.clients.claim(), deleteOldCaches()]));
});

self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
	if (event.request.headers.has('range') || event.request.method !== 'GET') {
		return;
	}

	const urlObject = new URL(event.request.url, location.origin);
	const {host, pathname, protocol} = urlObject;

	if (host !== location.host || protocol !== 'https:') {
		return;
	}
	if (pathname.startsWith('/_vercel')) {
		return;
	}

	if (pathname.includes('.')) {
		event.respondWith(cacheFirst(event.request));
	} else {
		event.respondWith(networkFirst(event.request));
	}
});
