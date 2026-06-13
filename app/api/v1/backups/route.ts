import { type NextRequest } from 'next/server';

import {
	type IBackupUploadBody,
	type IBackupUploadSuccessResponse,
	type ILegacyBackupErrorPayload,
	LEGACY_BACKUP_FREQUENCY_TTL,
} from '@/lib/account/legacyBackup/shared';
import { getLegacyBackupRequestMeta as getRequestMeta } from '@/lib/account/server/legacyBackupRequest';
import { uploadLegacyBackupData } from '@/lib/account/server/legacyBackup';
import { MAX_BACKUP_UPLOAD_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import { createRetryAfterHeaders } from '@/lib/api/http';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';
import { FILE_TYPE_JSON } from '@/utilities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createLegacyBackupRouteErrorResponse(message: string, status: number) {
	return createNoStoreErrorResponse(
		message,
		status,
		undefined,
		status === 429
			? {
					headers: createRetryAfterHeaders(
						LEGACY_BACKUP_FREQUENCY_TTL / 1000
					),
				}
			: undefined
	);
}

function normalizeMediaType(contentType: string | null | undefined) {
	return contentType?.split(';', 1).at(0)?.trim().toLowerCase() ?? null;
}

function checkLegacyBackupUploadMeta({
	contentType,
	ip,
	ua,
}: ReturnType<typeof getRequestMeta>): ILegacyBackupErrorPayload | null {
	if (normalizeMediaType(contentType) !== FILE_TYPE_JSON) {
		return { message: 'Invalid content type', status: 400 };
	}
	if (ip === null) {
		return { message: 'Invalid IP address', status: 400 };
	}
	if (ua === null) {
		return { message: 'Invalid user agent', status: 400 };
	}

	return null;
}

export async function POST(request: NextRequest) {
	const requestMeta = getRequestMeta(request);
	const metaError = checkLegacyBackupUploadMeta(requestMeta);
	if (metaError !== null) {
		return createLegacyBackupRouteErrorResponse(
			metaError.message,
			metaError.status
		);
	}

	const jsonResult = await readJsonBodyResult<IBackupUploadBody>(
		request,
		MAX_BACKUP_UPLOAD_JSON_BODY_BYTES
	);
	if (jsonResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('The data is too large', 413);
	}

	const uploadResult = await uploadLegacyBackupData({
		body: jsonResult.status === 'ok' ? jsonResult.data : null,
		meta: requestMeta,
	});
	if (uploadResult.status === 'error') {
		return createLegacyBackupRouteErrorResponse(
			uploadResult.message,
			uploadResult.httpStatus
		);
	}

	return createNoStoreJsonResponse(
		uploadResult.data satisfies IBackupUploadSuccessResponse
	);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
