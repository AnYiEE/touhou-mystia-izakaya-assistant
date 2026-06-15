import { type NextRequest } from 'next/server';

import { parseLegacyBackupCode } from '@/lib/account/server/legacyBackupCode';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = parseLegacyBackupCode(rawCode);
	if (code === null) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const legacyBackupModule =
		await import('@/lib/account/server/legacyBackup');
	const metadataResult =
		await legacyBackupModule.fetchLegacyBackupMetadata(code);
	if (metadataResult.status === 'error') {
		return createNoStoreErrorResponse(
			metadataResult.message,
			metadataResult.httpStatus
		);
	}

	return createNoStoreJsonResponse(metadataResult.data);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
