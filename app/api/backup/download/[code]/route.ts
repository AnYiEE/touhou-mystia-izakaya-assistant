import {NextRequest, NextResponse} from 'next/server';

import {getFile, getRecord, updateRecordTimeout} from '@/actions/backup';
import {FILE_TYPE_JSON} from '@/utilities';

export async function GET(
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

	await updateRecordTimeout(code, Date.now());

	const fileContent = await getFile(code);

	const isFileExisted = fileContent !== null;
	if (!isFileExisted) {
		return NextResponse.json({message: 'The file does not exist or has been deleted'}, {status: 404});
	}

	return new NextResponse(fileContent, {
		headers: {
			'Content-Type': FILE_TYPE_JSON,
		},
	});
}
