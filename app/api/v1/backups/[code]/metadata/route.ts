import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

import { getRecord } from '@/actions/backup';
import type { IBackupCheckSuccessResponse } from '../../types';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code } = await params;
	if (!validate(code)) {
		return createErrorResponse('Invalid code', 400);
	}

	const record = await getRecord(code);
	if (record.status === 404) {
		return createErrorResponse(
			'The file record does not exist or has been deleted',
			404
		);
	}

	const { created_at, last_accessed } = record;

	return createJsonResponse({
		created_at,
		last_accessed,
	} satisfies IBackupCheckSuccessResponse);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
