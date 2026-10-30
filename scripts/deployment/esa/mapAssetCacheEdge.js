/* global cache */

/**
 * 阿里云 ESA 边缘函数：地图图片 HEAD 鉴权 + 共享缓存。
 *
 * 地图 API 的常规 ESA 缓存必须关闭，确保每次请求都先执行本函数。图片 GET
 * 先向源站发送同路径 HEAD；仅 HEAD 200 时读取函数内 Cache API，未命中再
 * GET 源站。HEAD 非 200 时直接回源并返回真实错误。
 *
 * 地图图片 URL 不带 query，使用 ESA 默认 URL 缓存键即可；
 * 不依赖自定义 Cache Key。客户端的 Cache-Control 和请求头不会进入默认 URL key。
 * fetch 模式会以函数运行环境回源，因此函数使用边缘节点提供的
 * Ali-Cdn-Real-Ip 覆盖转发来源头，并修正最终响应中的 client-ip。
 */

const MAP_ASSET_API_PREFIX = '/api/v1/maps/assets/';
const MAP_IMAGE_PATH_REGEXP = /\.(?:png|webp)$/iu;
const PUBLIC_IMAGE_CACHE_CONTROL =
	'public, max-age=31536000, s-maxage=31536000, immutable';
const TRUSTED_CLIENT_IP_HEADER = 'ali-cdn-real-ip';
/** @type {ReadonlySet<string>} */
const EMPTY_DROPPED_HEADERS = new Set();

// 逐跳头与由边缘/代理重新生成的归属头不能直接进入源站。
const DROPPED_UPSTREAM_HEADERS = new Set([
	'connection',
	'content-length',
	'forwarded',
	'host',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'x-forwarded-for',
	'x-real-ip',
]);

// HEAD 只做权限探测。条件请求或 Range 可能让授权请求返回 304/206。
const DROPPED_AUTH_HEADERS = new Set([
	'if-match',
	'if-modified-since',
	'if-none-match',
	'if-range',
	'if-unmodified-since',
	'range',
]);

/**
 * @param {Request} request
 */
function getTrustedClientIp(request) {
	return request.headers.get(TRUSTED_CLIENT_IP_HEADER)?.trim() ?? '';
}

/**
 * @param {Request} request
 * @param {ReadonlySet<string>} additionalDroppedHeaders
 */
function createUpstreamHeaders(request, additionalDroppedHeaders) {
	const headers = new Headers();

	request.headers.forEach((value, name) => {
		const normalizedName = name.toLowerCase();
		if (
			!DROPPED_UPSTREAM_HEADERS.has(normalizedName) &&
			!additionalDroppedHeaders.has(normalizedName)
		) {
			headers.set(name, value);
		}
	});

	// fetch 模式回源的 TCP 来源是 ESA 内网地址，必须显式传递边缘节点
	// 提供的真实客户端 IP；客户端自行提交的来源头已在上面丢弃。
	const clientIp = getTrustedClientIp(request);
	if (clientIp !== '') {
		headers.set('x-forwarded-for', clientIp);
		headers.set('x-real-ip', clientIp);
	}

	return headers;
}

/**
 * @param {Request} request
 * @param {'GET' | 'HEAD'} method
 * @param {boolean} isAuthProbe
 */
function createUpstreamRequest(request, method, isAuthProbe) {
	return new Request(request.url, {
		cache: isAuthProbe ? 'no-store' : 'default',
		headers: createUpstreamHeaders(
			request,
			isAuthProbe ? DROPPED_AUTH_HEADERS : EMPTY_DROPPED_HEADERS
		),
		method,
		redirect: 'manual',
	});
}

/**
 * @param {Request} request
 * @param {URL} url
 * @returns {boolean}
 */
function checkMapAssetRequest(request, url) {
	if (request.method !== 'GET') {
		return false;
	}

	if (!url.pathname.startsWith(MAP_ASSET_API_PREFIX)) {
		return false;
	}

	const relativePath = url.pathname.slice(MAP_ASSET_API_PREFIX.length);
	return relativePath !== '' && MAP_IMAGE_PATH_REGEXP.test(relativePath);
}

/**
 * @param {Request} request
 * @param {URL} url
 * @returns {boolean}
 */
function checkSameOriginRequest(request, url) {
	const origin = request.headers.get('origin');
	if (origin === null) {
		return true;
	}

	try {
		return new URL(origin).origin === url.origin;
	} catch {
		return false;
	}
}

/**
 * @param {Response} response
 * @param {string} cacheControl
 */
function createResponseWithCacheControl(response, cacheControl) {
	const nextResponse = new Response(response.body, response);
	nextResponse.headers.delete('alt-svc');
	nextResponse.headers.set('Cache-Control', cacheControl);
	return nextResponse;
}

/**
 * @param {Response} response
 * @returns {boolean}
 */
function checkCacheableImageResponse(response) {
	const contentType = response.headers.get('content-type') ?? '';

	return (
		response.status === 200 &&
		(contentType.startsWith('image/png') ||
			contentType.startsWith('image/webp')) &&
		!response.headers.has('set-cookie')
	);
}

/**
 * @param {Response} response
 */
function createImageResponse(response) {
	if (!checkCacheableImageResponse(response)) {
		const nextResponse = createResponseWithCacheControl(
			response,
			'no-store'
		);
		nextResponse.headers.set('X-Map-Cache-Status', 'BYPASS');
		return nextResponse;
	}

	const nextResponse = createResponseWithCacheControl(
		response,
		PUBLIC_IMAGE_CACHE_CONTROL
	);
	nextResponse.headers.delete('Vary');
	return nextResponse;
}

/**
 * @param {URL} url
 */
function createEdgeCacheKey(url) {
	// 使用同 host 的保留路径生成合成 key，避免 Cache API 对象被 ESA
	// 常规缓存模块直接命中并绕过函数鉴权。该 URL 只作为 key，不会发起请求。
	return `http://${url.host}/.map-asset-cache${url.pathname}`;
}

/**
 * @param {Request} request
 */
async function fetchOriginWithoutCache(request) {
	const response = await fetch(createUpstreamRequest(request, 'GET', false), {
		cache: 'no-store',
	});
	const nextResponse = createResponseWithCacheControl(response, 'no-store');
	nextResponse.headers.set('X-Map-Cache-Status', 'BYPASS');
	return nextResponse;
}

/**
 * @returns {Response}
 */
function createBadGatewayResponse() {
	return new Response(null, {
		headers: {
			'Cache-Control': 'no-store',
			'X-Map-Cache-Status': 'BYPASS',
		},
		status: 502,
	});
}

/**
 * @param {Request} request
 * @param {Response} response
 */
function createClientResponse(request, response) {
	const nextResponse = new Response(response.body, response);
	const clientIp = getTrustedClientIp(request);

	if (clientIp === '') {
		nextResponse.headers.delete('client-ip');
	} else {
		nextResponse.headers.set('client-ip', clientIp);
	}

	return nextResponse;
}

/**
 * @param {Request} request
 * @param {URL} url
 */
async function handleMapAssetRequest(request, url) {
	let authResponse;
	try {
		authResponse = await fetch(
			createUpstreamRequest(request, 'HEAD', true)
		);
	} catch {
		return fetchOriginWithoutCache(request);
	}

	if (authResponse.status !== 200) {
		return fetchOriginWithoutCache(request);
	}

	const cacheKey = createEdgeCacheKey(url);
	let cachedResponse;
	try {
		cachedResponse = await cache.get(cacheKey);
	} catch {
		cachedResponse = undefined;
	}
	if (cachedResponse && checkCacheableImageResponse(cachedResponse)) {
		const nextResponse = createImageResponse(cachedResponse);
		nextResponse.headers.set('X-Map-Cache-Status', 'HIT');
		return nextResponse;
	}
	if (cachedResponse) {
		void cache.delete(cacheKey).catch(() => {});
	}

	const response = await fetch(createUpstreamRequest(request, 'GET', false));
	const nextResponse = createImageResponse(response);
	if (!checkCacheableImageResponse(response)) {
		return nextResponse;
	}

	nextResponse.headers.set('X-Map-Cache-Status', 'MISS');
	try {
		await cache.put(cacheKey, nextResponse.clone());
		nextResponse.headers.set('X-Map-Cache-Write', 'OK');
	} catch {
		// Cache quota/concurrency failure must not break the image response.
		nextResponse.headers.set('X-Map-Cache-Write', 'FAILED');
	}
	return nextResponse;
}

/**
 * @param {Request} request
 */
async function handleRequest(request) {
	const url = new URL(request.url);
	if (!checkMapAssetRequest(request, url)) {
		return fetch(request);
	}

	try {
		if (!checkSameOriginRequest(request, url)) {
			return createClientResponse(
				request,
				await fetchOriginWithoutCache(request)
			);
		}

		return createClientResponse(
			request,
			await handleMapAssetRequest(request, url)
		);
	} catch {
		return createClientResponse(request, createBadGatewayResponse());
	}
}

const edgeHandler = {
	/**
	 * @param {Request} request
	 */
	async fetch(request) {
		return handleRequest(request);
	},
};

export default edgeHandler;
