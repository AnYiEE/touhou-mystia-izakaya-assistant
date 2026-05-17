import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

import { getRecord } from '@/actions/backup';
import type { IBackupCheckSuccessResponse } from '../../types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code: rawCode } = await params;
	const code = rawCode.trim();
	if (!validate(code)) {
		return createNoStoreErrorResponse('Invalid code', 400);
	}

	const record = await getRecord(code);
	if (record.status === 404) {
		return createNoStoreErrorResponse(
			'The file record does not exist or has been deleted',
			404
		);
	}

	const { created_at, last_accessed } = record;

	return createNoStoreJsonResponse({
		created_at,
		last_accessed,
	} satisfies IBackupCheckSuccessResponse);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
