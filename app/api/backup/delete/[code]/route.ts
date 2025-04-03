import {NextRequest, NextResponse} from 'next/server';

import {deleteFile, deleteRecord, getRecord} from '@/actions/backup';

export async function DELETE(
	_request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			code: string;
		}>;
	}
) {
	const {code} = await params;

	const {status} = await getRecord(code);
	if (status === 404) {
		return NextResponse.json({message: 'The file record does not exist or has been deleted'}, {status});
	}

	await deleteRecord(code);
	await deleteFile(code);

	return NextResponse.json({message: 'The file record has been deleted'});
}
