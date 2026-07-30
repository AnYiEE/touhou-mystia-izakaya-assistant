import { type NextRequest } from 'next/server';

import { parseLegacyBackupCode } from '@/features/legacyBackup/server/code';
import { getLegacyBackupRequestMeta } from '@/features/legacyBackup/server/requestContext';

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
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse('Invalid code', 400);
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
			metadataResult.message,
			metadataResult.httpStatus,
			metadataResult.data,
			metadataResult.httpStatus === 429 && typeof retryAfter === 'number'
				? { headers: createRetryAfterHeaders(retryAfter) }
				: undefined
		);
	}

	return createNoStoreJsonResponse(metadataResult.data);
}
