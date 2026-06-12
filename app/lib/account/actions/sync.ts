'use server';

import { POST as importBackupCodeRoute } from '@/api/v1/sync/import-backup-code/route';
import {
	GET as getSyncStateRoute,
	PUT as putSyncStateRoute,
} from '@/api/v1/sync/state/route';
import {
	type TAccountActionResult,
	createAccountActionError as createActionError,
	isRecord,
	stringifyActionJsonBody,
} from '@/lib/account/actions/utils';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type ISyncImportBackupCodeResponse,
	type ISyncStateGetResponse,
	type ISyncStatePutResponse,
} from '@/lib/account/sync';
import {
	MAX_ACCOUNT_JSON_BODY_BYTES,
	MAX_SYNC_JSON_BODY_BYTES,
} from '@/lib/account/shared/requestLimits';
export type TAccountSyncActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

async function createJsonRequest(
	pathname: string,
	method: 'POST' | 'PUT',
	body: unknown,
	maxBytes: number,
	headers?: HeadersInit
) {
	const bodyResult = stringifyActionJsonBody(body, maxBytes);
	if (bodyResult.status !== 'ok') {
		return {
			message:
				bodyResult.status === 'payload-too-large'
					? 'payload-too-large'
					: 'invalid-object-structure',
			status: 'error' as const,
		};
	}
	const requestHeaders = new Headers(headers);
	requestHeaders.set('Content-Type', 'application/json');

	return {
		request: await createCurrentRequest(pathname, {
			body: bodyResult.text,
			headers: requestHeaders,
			method,
		}),
		status: 'ok' as const,
	};
}

async function readRouteActionResult<TData>(
	response: Response
): Promise<TAccountSyncActionResult<TData>> {
	let json: unknown;
	try {
		json = await response.json();
	} catch {
		return createActionError(
			response.statusText || 'invalid-api-response',
			response.status
		);
	}

	if (!isRecord(json)) {
		return createActionError('invalid-api-response', response.status);
	}
	if (json['status'] === 'error') {
		return createActionError(
			typeof json['message'] === 'string'
				? json['message']
				: 'invalid-api-response',
			response.status,
			isRecord(json['data']) ? json['data'] : undefined
		);
	}
	if (json['status'] === 'ok' && 'data' in json) {
		return { data: json['data'] as TData, status: 'ok' };
	}

	return createActionError('invalid-api-response', response.status);
}

export async function fetchSyncStateAction(
	namespaces: unknown = []
): Promise<TAccountSyncActionResult<ISyncStateGetResponse>> {
	if (!Array.isArray(namespaces)) {
		return createActionError('unknown-namespace', 400);
	}

	const searchParams = new URLSearchParams();
	for (const namespace of namespaces) {
		if (typeof namespace !== 'string') {
			return createActionError('unknown-namespace', 400);
		}
		searchParams.append('namespace', namespace);
	}
	const query = searchParams.toString();
	const request = await createCurrentRequest(
		`/api/v1/sync/state${query.length > 0 ? `?${query}` : ''}`
	);

	return readRouteActionResult(await getSyncStateRoute(request));
}

export async function putSyncStateAction(
	body: unknown,
	csrfToken: unknown
): Promise<TAccountSyncActionResult<ISyncStatePutResponse>> {
	const requestResult = await createJsonRequest(
		'/api/v1/sync/state',
		'PUT',
		body,
		MAX_SYNC_JSON_BODY_BYTES,
		typeof csrfToken === 'string'
			? { 'x-csrf-token': csrfToken }
			: undefined
	);
	if (requestResult.status === 'error') {
		return createActionError(
			requestResult.message,
			requestResult.message === 'payload-too-large' ? 413 : 400
		);
	}

	return readRouteActionResult(
		await putSyncStateRoute(requestResult.request)
	);
}

export async function importBackupCodeAction(
	code: unknown,
	csrfToken: unknown
): Promise<TAccountSyncActionResult<ISyncImportBackupCodeResponse>> {
	const requestResult = await createJsonRequest(
		'/api/v1/sync/import-backup-code',
		'POST',
		{ code },
		MAX_ACCOUNT_JSON_BODY_BYTES,
		typeof csrfToken === 'string'
			? { 'x-csrf-token': csrfToken }
			: undefined
	);
	if (requestResult.status === 'error') {
		return createActionError(
			requestResult.message,
			requestResult.message === 'payload-too-large' ? 413 : 400
		);
	}

	return readRouteActionResult(
		await importBackupCodeRoute(requestResult.request)
	);
}
