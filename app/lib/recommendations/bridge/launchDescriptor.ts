import {
	RECOMMENDATION_BRIDGE_PROTOCOL_VERSION,
	checkOwnProperty,
	parseJsonWithUniqueMembers,
} from './shared';

const LAUNCH_FRAGMENT_PREFIX = '#game-bridge=';
const LAUNCH_FRAGMENT_MAX_LENGTH = 4096;
const ENDPOINT_MAX_LENGTH = 2048;
const ENDPOINT_PATH_MAX_LENGTH = 256;
const INSTANCE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/u;
const PAIRING_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export interface IRecommendationBridgeLaunchDescriptor {
	readonly endpoint: string;
	readonly instance_id: string;
	readonly pairing_token: string;
	readonly protocol_version: 1;
}

let activeLaunchDescriptor: IRecommendationBridgeLaunchDescriptor | null = null;
let activeLaunchFragment: string | null = null;

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeBase64Url(value: string) {
	if (value === '' || !/^[A-Za-z0-9_-]+$/u.test(value)) {
		return null;
	}
	try {
		// String.prototype.replaceAll is newer than the browser compatibility floor.
		// eslint-disable-next-line unicorn/prefer-string-replace-all
		const base64 = value.replace(/-/gu, '+').replace(/_/gu, '/');
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const binary = globalThis.atob(`${base64}${padding}`);
		const bytes = Uint8Array.from(
			binary,
			(character) => character.codePointAt(0) ?? 0
		);
		const canonical = globalThis
			.btoa(binary)
			// eslint-disable-next-line unicorn/prefer-string-replace-all
			.replace(/\+/gu, '-')
			// eslint-disable-next-line unicorn/prefer-string-replace-all
			.replace(/\//gu, '_')
			.replace(/=+$/u, '');
		if (canonical !== value) {
			return null;
		}
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

function checkEndpoint(value: string) {
	if (value.length > ENDPOINT_MAX_LENGTH) {
		return false;
	}
	const authorityMatch = /^wss:\/\/([^/]+)(\/.*)?$/u.exec(value);
	if (
		authorityMatch === null ||
		!/:([0-9]+)$/u.test(authorityMatch[1] ?? '')
	) {
		return false;
	}
	const portText = /:([0-9]+)$/u.exec(authorityMatch[1] ?? '')?.[1];
	const port = Number(portText);
	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		return false;
	}
	try {
		const endpoint = new URL(value);
		return (
			endpoint.protocol === 'wss:' &&
			endpoint.username === '' &&
			endpoint.password === '' &&
			endpoint.search === '' &&
			endpoint.hash === '' &&
			endpoint.pathname.length <= ENDPOINT_PATH_MAX_LENGTH
		);
	} catch {
		return false;
	}
}

export function parseRecommendationBridgeLaunchDescriptor(
	fragment: string
): IRecommendationBridgeLaunchDescriptor | null {
	if (
		fragment.length > LAUNCH_FRAGMENT_MAX_LENGTH ||
		!fragment.startsWith(LAUNCH_FRAGMENT_PREFIX)
	) {
		return null;
	}
	const decoded = decodeBase64Url(
		fragment.slice(LAUNCH_FRAGMENT_PREFIX.length)
	);
	const value = decoded === null ? null : parseJsonWithUniqueMembers(decoded);
	if (
		!checkPlainObject(value) ||
		Object.keys(value).length !== 4 ||
		!checkOwnProperty(value, 'endpoint') ||
		!checkOwnProperty(value, 'instance_id') ||
		!checkOwnProperty(value, 'pairing_token') ||
		!checkOwnProperty(value, 'protocol_version') ||
		typeof value['endpoint'] !== 'string' ||
		!checkEndpoint(value['endpoint']) ||
		typeof value['instance_id'] !== 'string' ||
		!INSTANCE_ID_PATTERN.test(value['instance_id']) ||
		typeof value['pairing_token'] !== 'string' ||
		!PAIRING_TOKEN_PATTERN.test(value['pairing_token']) ||
		value['protocol_version'] !== RECOMMENDATION_BRIDGE_PROTOCOL_VERSION
	) {
		return null;
	}

	return value as unknown as IRecommendationBridgeLaunchDescriptor;
}

function captureLaunchDescriptor() {
	if (!checkOwnProperty(globalThis, 'window')) {
		return;
	}
	const fragment = globalThis.location.hash;
	if (!fragment.startsWith(LAUNCH_FRAGMENT_PREFIX)) {
		return;
	}

	globalThis.history.replaceState(
		globalThis.history.state,
		'',
		`${globalThis.location.pathname}${globalThis.location.search}`
	);
	const descriptor = parseRecommendationBridgeLaunchDescriptor(fragment);
	if (descriptor !== null) {
		activeLaunchDescriptor = descriptor;
		activeLaunchFragment = fragment;
	}
}

captureLaunchDescriptor();

export function readRecommendationBridgeLaunchDescriptor() {
	return activeLaunchDescriptor;
}

export function discardRecommendationBridgeLaunchDescriptor() {
	activeLaunchDescriptor = null;
	activeLaunchFragment = null;
}

export function createRecommendationBridgeContinuationUrl(targetUrl: string) {
	if (
		activeLaunchDescriptor === null ||
		activeLaunchFragment === null ||
		!checkOwnProperty(globalThis, 'window')
	) {
		return targetUrl;
	}

	try {
		const target = new URL(targetUrl, globalThis.location.href);
		if (
			target.origin !== globalThis.location.origin ||
			targetUrl.includes('#')
		) {
			return targetUrl;
		}
		target.hash = activeLaunchFragment;
		return target.toString();
	} catch {
		return targetUrl;
	}
}
