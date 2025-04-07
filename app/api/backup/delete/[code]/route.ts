import {NextRequest, NextResponse} from 'next/server';
import {validate} from 'uuid';

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
	if (!validate(code)) {
		return NextResponse.json({message: 'Invalid code'}, {status: 400});
	}

	const {status} = await getRecord(code);
	if (status === 404) {
		return NextResponse.json({message: 'The file record does not exist or has been deleted'}, {status: 404});
	}

	await deleteRecord(code);
	await deleteFile(code);

	return NextResponse.json({message: 'The file record has been deleted'});
}
