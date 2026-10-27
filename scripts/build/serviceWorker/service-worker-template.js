// @ts-check
/* eslint-disable unicorn/prefer-global-this, unicorn/prefer-module */
'use strict';

(() => {
	const CACHE_NAMESPACE = 'offline/';
	const VERSION = `${CACHE_NAMESPACE}{{version}}`;

	// Map art sits under content-hash directories, so a cached copy never goes
	// stale. It lives in its own cache that survives releases; entries outside
	// the directories this build publishes are removed on activation.
	const MAP_CACHE = 'maps/assets';
	const MAP_ASSET_PATH = '/assets/maps/';
	const MAP_ASSET_API_PATH = '/api/v1/maps/assets/';
	/** @type {string[]} */
	const MAP_ASSET_DIRECTORIES = JSON.parse('{{mapAssetDirectories}}');
	const STATIC_CACHE = 'static/assets';
	const STATIC_ASSET_PATH = '/assets/';
	/** @type {string[]} */
	const STATIC_ASSET_DIRECTORIES = JSON.parse('{{staticAssetDirectories}}');

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

	/**
	 * @returns {{
	 *   isApi: boolean,
	 *   path: string,
	 * } | null}
	 * The path below either map asset prefix, if any.
	 */
	function getMapAssetPath(/** @type {string} */ pathname) {
		if (pathname.startsWith(MAP_ASSET_API_PATH)) {
			return {
				isApi: true,
				path: pathname.slice(MAP_ASSET_API_PATH.length),
			};
		}
		if (pathname.startsWith(MAP_ASSET_PATH)) {
			return {
				isApi: false,
				path: pathname.slice(MAP_ASSET_PATH.length),
			};
		}
		return null;
	}

	function checkCurrentMapAsset(/** @type {string} */ path) {
		return MAP_ASSET_DIRECTORIES.some((directory) =>
			path.startsWith(directory)
		);
	}

	async function deleteStaleMapAssets() {
		const cache = await caches.open(MAP_CACHE);
		const requests = await cache.keys();
		const staleRequests = requests.filter((request) => {
			const url = new URL(request.url);
			const mapAsset = getMapAssetPath(url.pathname);
			return (
				mapAsset === null ||
				url.origin !== location.origin ||
				!checkCurrentMapAsset(mapAsset.path)
			);
		});

		await Promise.all(
			staleRequests.map((request) => cache.delete(request))
		);
	}

	/** @returns {string | null} The path below `/assets/`, if any. */
	function getStaticAssetPath(/** @type {string} */ pathname) {
		const index = pathname.indexOf(STATIC_ASSET_PATH);
		return index === -1
			? null
			: pathname.slice(index + STATIC_ASSET_PATH.length);
	}

	function checkCurrentStaticAsset(/** @type {string} */ path) {
		return STATIC_ASSET_DIRECTORIES.some((directory) =>
			path.startsWith(directory)
		);
	}

	async function deleteStaleStaticAssets() {
		const cache = await caches.open(STATIC_CACHE);
		const requests = await cache.keys();
		const staleRequests = requests.filter((request) => {
			const path = getStaticAssetPath(new URL(request.url).pathname);
			return path === null || !checkCurrentStaticAsset(path);
		});

		await Promise.all(
			staleRequests.map((request) => cache.delete(request))
		);
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
		/** @type {FetchEvent} */ event,
		cacheName = VERSION
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
				putInCache(request, response.clone(), cacheName).catch(() => {})
			);
		}

		return response;
	}

	function checkCacheableMapAssetResponse(/** @type {Response} */ response) {
		const contentType = response.headers
			.get('Content-Type')
			?.split(';', 1)[0]
			?.trim()
			.toLowerCase();
		return (
			response.status === 200 &&
			(contentType === 'image/png' || contentType === 'image/webp')
		);
	}

	async function fetchMapAssetAndCache(
		/** @type {Request} */ request,
		/** @type {FetchEvent} */ event
	) {
		const response = await fetch(request, { cache: 'no-cache' });
		if (checkCacheableMapAssetResponse(response)) {
			event.waitUntil(
				putInCache(request, response.clone(), MAP_CACHE).catch(() => {})
			);
		}
		return response;
	}

	/**
	 * @param {Cache} cache
	 * @param {string} path
	 */
	async function findLegacyMapAsset(cache, path) {
		const url = new URL(
			`${MAP_ASSET_PATH}${path}`,
			location.origin
		).toString();
		const response = await cache.match(url);
		if (response !== undefined) {
			if (checkCacheableMapAssetResponse(response)) {
				return response;
			}
			await cache.delete(url);
		}
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
		/** @type {typeof fetchAndCache} */ fetcher,
		cacheName = VERSION
	) {
		try {
			return await fetcher(request, event, cacheName);
		} catch (error) {
			if (retries > 1) {
				await delay(1000);
				return fetchWithRetry(
					request,
					retries - 1,
					event,
					fetcher,
					cacheName
				);
			}
			throw error;
		}
	}

	/**
	 * @param {Request} request
	 * @param {FetchEvent} event
	 * @param {{ isApi: boolean, path: string }} mapAsset
	 */
	async function cacheFirstMapAsset(request, event, mapAsset) {
		const cache = await caches.open(MAP_CACHE);
		const responseFromCache = await cache.match(request);
		if (responseFromCache !== undefined) {
			if (checkCacheableMapAssetResponse(responseFromCache)) {
				return responseFromCache;
			}
			await cache.delete(request);
		}
		if (mapAsset.isApi) {
			const legacyResponse = await findLegacyMapAsset(
				cache,
				mapAsset.path
			);
			if (legacyResponse !== undefined) {
				return legacyResponse;
			}
		}

		return await fetchWithRetry(
			request,
			3,
			event,
			fetchMapAssetAndCache,
			MAP_CACHE
		);
	}

	async function cacheFirst(
		/** @type {Request} */ request,
		/** @type {FetchEvent} */ event,
		cacheName = VERSION
	) {
		const cache = await caches.open(cacheName);
		const responseFromCache = await cache.match(request);
		if (responseFromCache !== undefined) {
			return responseFromCache;
		}

		try {
			return await fetchWithRetry(
				request,
				3,
				event,
				fetchAndCache,
				cacheName
			);
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
				Promise.all([
					self.clients.claim(),
					deleteOldCaches(),
					deleteStaleMapAssets(),
					deleteStaleStaticAssets(),
				])
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
		if (
			searchParams.has('_rsc') ||
			event.request.headers.get('rsc') === '1' ||
			event.request.headers.has('next-router-prefetch') ||
			event.request.headers.has('next-router-state-tree')
		) {
			return;
		}

		if (
			pathname.startsWith('/admin') ||
			pathname.startsWith('/preferences') ||
			pathname.startsWith('/sso')
		) {
			// Never cache protected routes that may contain
			// user-specific data or session-dependent content.
			return;
		}

		const mapAsset = getMapAssetPath(pathname);
		if (mapAsset !== null && checkCurrentMapAsset(mapAsset.path)) {
			event.respondWith(
				cacheFirstMapAsset(event.request, event, mapAsset)
			);
			return;
		}
		if (pathname === '/api' || pathname.startsWith('/api/')) {
			return;
		}

		const staticAssetPath = getStaticAssetPath(pathname);
		if (
			staticAssetPath !== null &&
			checkCurrentStaticAsset(staticAssetPath)
		) {
			event.respondWith(cacheFirst(event.request, event, STATIC_CACHE));
			return;
		}

		if (pathname.includes('.')) {
			// Cache all static assets (file has extension).
			event.respondWith(cacheFirst(event.request, event));
		} else {
			// Cache public routes (file has no extension).
			event.waitUntil(
				fetchAnonymousNavigationAndCache(event.request).catch(() => {})
			);
			event.respondWith(networkFirst(event.request, event));
		}
	});
})();
