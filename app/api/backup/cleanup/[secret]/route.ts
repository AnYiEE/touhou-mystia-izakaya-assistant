import {type NextRequest, NextResponse} from 'next/server';
import {env} from 'node:process';

import {deleteFile, deleteRecord, getExpiredRecords} from '@/actions/backup';

export async function DELETE(
	_request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			secret: string;
		}>;
	}
) {
	const {secret} = await params;

	if (secret !== env.CLEANUP_SECRET) {
		return NextResponse.json({message: 'Invalid secret'}, {status: 401});
	}

	const now = Date.now();
	const sixMonthsAgo = now - 181 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);

	let deletedCount = 0;
	await Promise.allSettled(
		records.map(async ({code}) => {
			await deleteFile(code);
			await deleteRecord(code);
			deletedCount++;
		})
	);

	return NextResponse.json({
		deletedCount,
		deletedFiles: records.map(({code}) => code),
	});
}
