import {NextRequest, NextResponse} from 'next/server';

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

	if (secret !== process.env.CLEANUP_SECRET) {
		return NextResponse.json({message: 'Invalid secret'}, {status: 401});
	}

	const now = Date.now();
	const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

	const records = await getExpiredRecords(sixMonthsAgo);

	let deletedCount = 0;
	await Promise.all(
		records.map(async ({code}) => {
			deletedCount++;
			await deleteRecord(code);
			await deleteFile(code);
		})
	);

	return NextResponse.json({
		deletedCount,
		deletedFiles: records.map(({code}) => code),
	});
}
