import { type NextRequest } from 'next/server';

import {
	LEGACY_BACKUP_API_RESPONSE_MESSAGE_MAP,
	translateLegacyBackupApiResponseMessage,
} from '@/features/legacyBackup/apiResponseMessages';
import { parseLegacyBackupCode } from '@/features/legacyBackup/server/code';
import { getLegacyBackupRequestMeta } from '@/features/legacyBackup/server/requestContext';
import { readContentLocale } from '@/features/preferences/server/requestLocale';

import { createRetryAfterHeaders } from '@/infrastructure/http/headers';
import {
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
	const metadataResult = await legacyBackupModule.fetchLegacyBackupMetadata({
		code,
		ip: requestMeta.ip,
	});
	if (metadataResult.status === 'error') {
		const retryAfter = metadataResult.data?.['retry_after'];
		return createNoStoreErrorResponse(
			translateLegacyBackupApiResponseMessage(
				metadataResult.message,
				locale
			),
			metadataResult.httpStatus,
			metadataResult.data,
			metadataResult.httpStatus === 429 && typeof retryAfter === 'number'
				? { headers: createRetryAfterHeaders(retryAfter) }
				: undefined
		);
	}

	return createNoStoreJsonResponse(metadataResult.data);
}
