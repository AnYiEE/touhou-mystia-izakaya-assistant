import { type NextRequest } from 'next/server';
import { env } from 'node:process';

import { deleteFile, deleteRecord, getExpiredRecords } from '@/actions/backup';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ secret: string }> }
) {
	const { secret } = await params;

	if (secret !== env.CLEANUP_SECRET) {
		return createErrorResponse('Invalid secret', 401);
	}

	const now = Date.now();
	const sixMonthsAgo = now - 181 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);

	const deletedCodes: string[] = [];
	await Promise.allSettled(
		records.map(async ({ code }) => {
			await deleteFile(code);
			await deleteRecord(code);
			deletedCodes.push(code);
		})
	);

	return createJsonResponse({
		deletedCount: deletedCodes.length,
		deletedFiles: deletedCodes,
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
