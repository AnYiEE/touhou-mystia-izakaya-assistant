import {type NextRequest, NextResponse} from 'next/server';
import {validate} from 'uuid';

import {checkIpFrequency, getFile, getRecord, updateRecordTimeout} from '@/actions/backup';
import {FREQUENCY_TTL} from '@/api/backup/constant';
import {getRequestMeta} from '@/api/backup/utils';
import {FILE_TYPE_JSON} from '@/utilities';

export async function GET(
	request: NextRequest,
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

	const {ip, ua} = getRequestMeta(request);
	if (ip === null) {
		return NextResponse.json({message: 'Invalid IP address'}, {status: 400});
	}
	if (ua === null) {
		return NextResponse.json({message: 'Invalid user agent'}, {status: 400});
	}

	let userId = request.nextUrl.searchParams.get('user_id') ?? '';
	if (userId === 'null') {
		userId = '';
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency('last_accessed', now - FREQUENCY_TTL, {
		ip,
		ua,
		userId: request.nextUrl.searchParams.get('user_id') ?? '',
	});
	if (recentRecord.status === 429) {
		return NextResponse.json({message: 'Requests are too frequent'}, {status: 429});
	}

	const {status} = await getRecord(code);
	if (status === 404) {
		return NextResponse.json({message: 'The file record does not exist or has been deleted'}, {status: 404});
	}

	await updateRecordTimeout(code, now);

	let fileContent: string;
	try {
		fileContent = await getFile(code);
	} catch {
		return NextResponse.json({message: 'The file does not exist or has been deleted'}, {status: 404});
	}

	return new NextResponse(fileContent, {
		headers: {
			'Content-Type': FILE_TYPE_JSON,
		},
	});
}
