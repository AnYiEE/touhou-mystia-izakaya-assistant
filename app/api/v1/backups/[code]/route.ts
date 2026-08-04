import { type NextRequest, NextResponse } from 'next/server';

import { LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP } from '@/features/legacyBackup/apiResponseMessages';
import { parseLegacyBackupCode } from '@/features/legacyBackup/server/code';
import { getLegacyBackupRequestMeta } from '@/features/legacyBackup/server/requestContext';

import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import { FILE_TYPE_JSON } from '@/infrastructure/http/mediaTypes';
import {
	NO_STORE_HEADERS,
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidCode,
			400
		);
	}

	const requestMeta = getLegacyBackupRequestMeta(request);
	const legacyBackupModule =
		await import('@/features/legacyBackup/server/service');
	const downloadResult = await legacyBackupModule.downloadLegacyBackupData({
		code,
		ip: requestMeta.ip,
	});
	if (downloadResult.status === 'error') {
		return createNoStoreErrorResponse(
			downloadResult.message,
			downloadResult.httpStatus
		);
	}

	return new NextResponse(downloadResult.content, {
		headers: { ...NO_STORE_HEADERS, 'Content-Type': FILE_TYPE_JSON },
	});
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidCode,
			400
		);
	}

	const requestMeta = getLegacyBackupRequestMeta(request);
	const legacyBackupModule =
		await import('@/features/legacyBackup/server/service');
	const deleteResult = await legacyBackupModule.deleteLegacyBackupData({
		code,
		ip: requestMeta.ip,
	});
	if (deleteResult.status === 'error') {
		const retryAfter = deleteResult.data?.['retry_after'];
		return createNoStoreErrorResponse(
			deleteResult.message,
			deleteResult.httpStatus,
			deleteResult.data,
			deleteResult.httpStatus === 429 && typeof retryAfter === 'number'
				? { headers: createRetryAfterHeaders(retryAfter) }
				: undefined
		);
	}

	return createNoStoreJsonResponse(deleteResult.data);
}
