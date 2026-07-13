// @ts-check
/* eslint-disable unicorn/prefer-global-this, unicorn/prefer-module */
'use strict';

(() => {
	const CACHE_NAMESPACE = 'offline/';
	const VERSION = `${CACHE_NAMESPACE}{{version}}`;

	const CDN_URL = '{{cdnUrl}}';
	const FAKE_URL = 'https://url.internal';

	const CDN_HOST = new URL(CDN_URL, FAKE_URL).host;
	const IS_USE_CDN = Boolean(CDN_URL);

	const networkErrorResponse = new Response(
		'A network error occurred, but no cached resources were found.',
		{ headers: { 'Content-Type': 'text/plain' }, status: 418 }
	);

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
		const cachesToDelete = keyArray.filter(
			(key) => key.startsWith(CACHE_NAMESPACE) && key !== VERSION
		);

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

	async function fetchAndCache(
		/** @type {Request} */ request,
		/** @type {FetchEvent} */ event
	) {
		const response = await fetch(request, {
			cache: 'no-cache',
			// When caching cross-origin resources, the mode must be set to `cors`,
			// so that the cached resources have the correct size (i.e., non-opaque responses).
			// At the same time, the `Access-Control-Allow-Credentials` and the `Access-Control-Allow-Origin` headers should be set for the CDN server.
			// The value of `Access-Control-Allow-Credentials` needs to be set to `true`,
			// the value of `Access-Control-Allow-Origin` needs to be set to a specific domain name and cannot be a wildcard.
			mode: IS_USE_CDN ? 'cors' : undefined,
		});

		if (response.ok) {
			event.waitUntil(
				putInCache(request, response.clone(), VERSION).catch(() => {})
			);
		}

		return response;
	}

	async function fetchAnonymousNavigationAndCache(
		/** @type {Request} */ request
	) {
		const cache = await caches.open(VERSION);
		const responseFromCache = await cache.match(request);
		if (responseFromCache !== undefined) {
			return;
		}

		const response = await fetch(request.url, {
			cache: 'no-cache',
			credentials: 'omit',
			headers: request.headers,
		});

		if (response.ok) {
			await cache.put(request, response);
		}
	}

	async function fetchWithoutCache(/** @type {Request} */ request) {
		return fetch(request, { cache: 'no-cache' });
	}

	async function fetchWithRetry(
		/** @type {Request} */ request,
		/** @type {number} */ retries,
		/** @type {FetchEvent} */ event,
		/** @type {typeof fetchAndCache} */ fetcher
	) {
		try {
			return await fetcher(request, event);
		} catch (error) {
			if (retries > 1) {
				await delay(1000);
				return fetchWithRetry(request, retries - 1, event, fetcher);
			}
			throw error;
		}
	}

	async function cacheFirst(
		/** @type {Request} */ request,
		/** @type {FetchEvent} */ event
	) {
		const cache = await caches.open(VERSION);
		const responseFromCache = await cache.match(request);
		if (responseFromCache !== undefined) {
			return responseFromCache;
		}

		try {
			return await fetchWithRetry(request, 3, event, fetchAndCache);
		} catch {
			return networkErrorResponse.clone();
		}
	}

	async function networkFirst(
		/** @type {Request} */ request,
		/** @type {FetchEvent} */ event
	) {
		const cache = await caches.open(VERSION);
		const responseFromCache = await cache.match(request);

		try {
			return await fetchWithRetry(request, 3, event, fetchWithoutCache);
		} catch {
			return responseFromCache ?? networkErrorResponse.clone();
		}
	}

	self.addEventListener('install', (/** @type {ExtendableEvent} */ event) => {
		event.waitUntil(self.skipWaiting());
	});

	self.addEventListener(
		'activate',
		(/** @type {ExtendableEvent} */ event) => {
			event.waitUntil(
				Promise.all([self.clients.claim(), deleteOldCaches()])
			);
		}
	);

	self.addEventListener('fetch', (/** @type {FetchEvent} */ event) => {
		if (
			event.request.headers.has('range') ||
			event.request.method !== 'GET'
		) {
			return;
		}

		const urlObject = new URL(event.request.url, FAKE_URL);
		const { host, hostname, pathname, protocol, searchParams } = urlObject;

		const isCdnServer = host === CDN_HOST;
		const isSelfHost = host === location.host;

		const isLocalhost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
			hostname
		);

		if (
			!(isCdnServer || isSelfHost) ||
			(protocol !== 'https:' && !isLocalhost)
		) {
			return;
		}
		if (pathname === '/api' || pathname.startsWith('/api/')) {
			return;
		}
		if (
			searchParams.has('_rsc') ||
			event.request.headers.get('rsc') === '1' ||
			event.request.headers.has('next-router-prefetch') ||
			event.request.headers.has('next-router-state-tree')
		) {
			return;
		}

		if (pathname.includes('.')) {
			// Cache all static assets (file has extension).
			event.respondWith(cacheFirst(event.request, event));
		} else if (
			pathname.startsWith('/admin') ||
			pathname.startsWith('/preferences') ||
			pathname.startsWith('/sso')
		) {
			// Never cache protected routes that may contain
			// user-specific data or session-dependent content.
		} else {
			// Cache public routes (file has no extension).
			event.waitUntil(
				fetchAnonymousNavigationAndCache(event.request).catch(() => {})
			);
			event.respondWith(networkFirst(event.request, event));
		}
	});
})();
