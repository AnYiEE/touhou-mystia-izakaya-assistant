import { type NextRequest } from 'next/server';

import { parseLegacyBackupCode } from '@/lib/account/server/legacyBackupCode';
import { getLegacyBackupRequestMeta as getRequestMeta } from '@/lib/account/server/legacyBackupRequest';
import { createRetryAfterHeaders } from '@/lib/api/http';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

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
