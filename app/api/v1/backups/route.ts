import { type NextRequest } from 'next/server';

import { MAX_BACKUP_UPLOAD_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP } from '@/features/legacyBackup/apiResponseMessages';
import {
	type IBackupUploadBody,
	type IBackupUploadSuccessResponse,
	type ILegacyBackupErrorPayload,
	LEGACY_BACKUP_FREQUENCY_TTL,
} from '@/features/legacyBackup/contracts';
import { getLegacyBackupRequestMeta } from '@/features/legacyBackup/server/requestContext';

import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import {
	FILE_TYPE_JSON,
	normalizeMediaType,
} from '@/infrastructure/http/mediaTypes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

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

function checkLegacyBackupUploadMeta({
	contentType,
	ip,
	ua,
}: ReturnType<
	typeof getLegacyBackupRequestMeta
>): ILegacyBackupErrorPayload | null {
	if (normalizeMediaType(contentType) !== FILE_TYPE_JSON) {
		return {
			message: LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidContentType,
			status: 400,
		};
	}
	if (ip === null) {
		return {
			message: LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidIpAddress,
			status: 400,
		};
	}
	if (ua === null) {
		return {
			message: LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.invalidUserAgent,
			status: 400,
		};
	}

	return null;
}

export async function POST(request: NextRequest) {
	const requestMeta = getLegacyBackupRequestMeta(request);
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
		return createNoStoreErrorResponse(
			LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP.dataTooLarge,
			413
		);
	}

	const legacyBackupModule =
		await import('@/features/legacyBackup/server/service');
	const uploadResult = await legacyBackupModule.uploadLegacyBackupData({
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
