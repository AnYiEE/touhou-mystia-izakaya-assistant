import { type NextRequest, NextResponse } from 'next/server';

import {
	LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP,
	translateLegacyBackupApiResponseMessage,
} from '@/features/legacyBackup/apiResponseMessages';
import { parseLegacyBackupCode } from '@/features/legacyBackup/server/code';
import { getLegacyBackupRequestMeta } from '@/features/legacyBackup/server/requestContext';
import { readContentLocale } from '@/features/preferences/server/requestLocale';

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
	const locale = readContentLocale(request);
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse(
			translateLegacyBackupApiResponseMessage(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidCode,
				locale
			),
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
			translateLegacyBackupApiResponseMessage(
				downloadResult.message,
				locale
			),
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
	const locale = readContentLocale(request);
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse(
			translateLegacyBackupApiResponseMessage(
				LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidCode,
				locale
			),
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
			translateLegacyBackupApiResponseMessage(
				deleteResult.message,
				locale
			),
			deleteResult.httpStatus,
			deleteResult.data,
			deleteResult.httpStatus === 429 && typeof retryAfter === 'number'
				? { headers: createRetryAfterHeaders(retryAfter) }
				: undefined
		);
	}

	return createNoStoreJsonResponse(deleteResult.data);
}
