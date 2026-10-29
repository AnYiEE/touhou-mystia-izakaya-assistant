/**
 * 阿里云 ESA 边缘函数：地图图片 HEAD 鉴权 + 共享缓存。
 *
 * 函数必须在站点缓存之前执行。图片 GET 先向源站发送同路径 HEAD：
 * - HEAD 200：允许本次 GET 使用共享缓存。
 * - HEAD 非 200：不使用共享缓存，原始 GET 直接回源并原样返回错误。
 *
 * 缓存键必须配置为 host + pathname，并忽略 Cookie、query 和请求头。
 */

const MAP_ASSET_API_PREFIX = '/api/v1/maps/assets/';
const MAP_IMAGE_PATH_REGEXP = /\.(?:png|webp)$/iu;
const PUBLIC_IMAGE_CACHE_CONTROL =
	'public, max-age=31536000, s-maxage=31536000, immutable';
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
		return createResponseWithCacheControl(response, 'no-store');
	}

	const nextResponse = createResponseWithCacheControl(
		response,
		PUBLIC_IMAGE_CACHE_CONTROL
	);
	nextResponse.headers.delete('Vary');
	return nextResponse;
}

/**
 * @param {Request} request
 */
async function fetchOriginWithoutCache(request) {
	const response = await fetch(createUpstreamRequest(request, 'GET', false), {
		cache: 'no-store',
	});
	return createResponseWithCacheControl(response, 'no-store');
}

/**
 * @returns {Response}
 */
function createBadGatewayResponse() {
	return new Response(null, {
		headers: { 'Cache-Control': 'no-store' },
		status: 502,
	});
}

/**
 * @param {Request} request
 */
async function handleMapAssetRequest(request) {
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

	const response = await fetch(createUpstreamRequest(request, 'GET', false));
	return createImageResponse(response);
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
			return await fetchOriginWithoutCache(request);
		}

		return await handleMapAssetRequest(request);
	} catch {
		return createBadGatewayResponse();
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
