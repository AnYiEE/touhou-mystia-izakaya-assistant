'use server';

import type {
	IBackupCheckSuccessResponse,
	IBackupUploadBody,
	IBackupUploadSuccessResponse,
	TLegacyBackupResult,
} from '@/lib/account/legacyBackup/shared';
import { type TAccountActionResult } from '@/lib/account/actions/utils';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import { parseLegacyBackupCode } from '@/lib/account/server/legacyBackupCode';
import { getLegacyBackupRequestMeta } from '@/lib/account/server/legacyBackupRequest';

export type TLegacyBackupActionResult<TData = Record<string, unknown>> =
	TAccountActionResult<TData>;

function createLegacyBackupActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TLegacyBackupActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function readLegacyBackupResult<TData>(
	result: TLegacyBackupResult<TData>
): TLegacyBackupActionResult<TData> {
	if (result.status === 'error') {
		return createLegacyBackupActionError(
			result.message,
			result.httpStatus,
			result.data
		);
	}

	return result;
}

function readLegacyBackupDownloadResult<TData>(
	result: Awaited<
		ReturnType<
			(typeof import('@/lib/account/server/legacyBackup'))['downloadLegacyBackupData']
		>
	>
): TLegacyBackupActionResult<TData> {
	if (result.status === 'error') {
		return createLegacyBackupActionError(
			result.message,
			result.httpStatus,
			result.data
		);
	}

	try {
		return { data: JSON.parse(result.content) as TData, status: 'ok' };
	} catch {
		return createLegacyBackupActionError(
			'Invalid legacy backup response',
			500
		);
	}
}

function validateLegacyBackupActionCode(code: string) {
	const parsedCode = parseLegacyBackupCode(code);
	return parsedCode === null
		? createLegacyBackupActionError('Invalid code', 400)
		: { code: parsedCode, status: 'ok' as const };
}

export async function fetchLegacyBackupMetadataAction(
	code: string
): Promise<TLegacyBackupActionResult<IBackupCheckSuccessResponse>> {
	const codeResult = validateLegacyBackupActionCode(code);
	if (codeResult.status === 'error') {
		return codeResult;
	}
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
	const result = await legacyBackupModule.fetchLegacyBackupMetadata(
		codeResult.code
	);

	return readLegacyBackupResult<IBackupCheckSuccessResponse>(result);
}

export async function deleteLegacyBackupAction(
	code: string
): Promise<TLegacyBackupActionResult> {
	const codeResult = validateLegacyBackupActionCode(code);
	if (codeResult.status === 'error') {
		return codeResult;
	}
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
	const result = await legacyBackupModule.deleteLegacyBackupData(
		codeResult.code
	);

	return readLegacyBackupResult(result);
}

export async function downloadLegacyBackupAction<TData>(
	code: string
): Promise<TLegacyBackupActionResult<TData>> {
	const codeResult = validateLegacyBackupActionCode(code);
	if (codeResult.status === 'error') {
		return codeResult;
	}
	const request = await createCurrentRequest(
		`/api/v1/backups/${encodeURIComponent(code)}`
	);
	const { ip } = getLegacyBackupRequestMeta(request);
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
	const result = await legacyBackupModule.downloadLegacyBackupData({
		code: codeResult.code,
		ip,
	});

	return readLegacyBackupDownloadResult<TData>(result);
}

export async function uploadLegacyBackupAction(
	body: IBackupUploadBody
): Promise<TLegacyBackupActionResult<IBackupUploadSuccessResponse>> {
	const request = await createCurrentRequest('/api/v1/backups', {
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	});
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
	const result = await legacyBackupModule.uploadLegacyBackupData({
		body,
		meta: getLegacyBackupRequestMeta(request),
	});

	return readLegacyBackupResult<IBackupUploadSuccessResponse>(result);
}
