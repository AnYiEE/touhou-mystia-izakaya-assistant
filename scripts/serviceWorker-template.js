const VERSION = 'offline/{{version}}';

const deleteCache = async (key) => {
	await caches.delete(key);
};

const deleteOldCaches = async () => {
	const keyArray = await caches.keys();
	const cachesToDelete = keyArray.filter((key) => key !== VERSION);

	await Promise.all(cachesToDelete.map((key) => deleteCache(key)));
};

const putInCache = async (request, response, version) => {
	const cache = await caches.open(version);

	await cache.put(request, response);
};

const networkFirst = async (request) => {
	try {
		const responseFromNetwork = await fetch(request);

		putInCache(request, responseFromNetwork.clone(), VERSION);

		return responseFromNetwork;
	} catch {
		const responseFromCache = await caches.match(request);
		if (responseFromCache) {
			return responseFromCache;
		}

		return new Response('A network error occurred, but no cached resources were found.', {
			headers: {'Content-Type': 'text/plain'},
			status: 418,
		});
	}
};

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('install', (event) => {
	event.waitUntil(Promise.all([deleteOldCaches(), self.skipWaiting()]));
});

self.addEventListener('fetch', (event) => {
	if (event.request.headers.has('range') || event.request.method !== 'GET') {
		return;
	}

	const urlObject = new URL(event.request.url, location.origin);
	if (urlObject.host !== location.host || urlObject.protocol !== 'https:') {
		return;
	}

	event.respondWith(networkFirst(event.request));
});
