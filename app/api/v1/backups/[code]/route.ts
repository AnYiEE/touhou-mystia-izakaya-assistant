import { type NextRequest, NextResponse } from 'next/server';

import { parseLegacyBackupCode } from '@/lib/account/server/legacyBackupCode';
import { getLegacyBackupRequestMeta as getRequestMeta } from '@/lib/account/server/legacyBackupRequest';
import { createRetryAfterHeaders } from '@/lib/api/http';
import {
	NO_STORE_HEADERS,
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/lib/api/routeResponses';
import { FILE_TYPE_JSON } from '@/utilities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const requestMeta = getRequestMeta(request);
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
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
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const requestMeta = getRequestMeta(request);
	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
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

export function OPTIONS() {
	return handleOptionsRequest();
}
