import { type NextRequest, NextResponse } from 'next/server';

import {
	deleteLegacyBackupData,
	downloadLegacyBackupData,
	parseLegacyBackupCode,
} from '@/lib/account/server/legacyBackup';
import { getLegacyBackupRequestMeta as getRequestMeta } from '@/lib/account/server/legacyBackupRequest';
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
	const downloadResult = await downloadLegacyBackupData({
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
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const deleteResult = await deleteLegacyBackupData(code);
	if (deleteResult.status === 'error') {
		return createNoStoreErrorResponse(
			deleteResult.message,
			deleteResult.httpStatus
		);
	}

	return createNoStoreJsonResponse(deleteResult.data);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
