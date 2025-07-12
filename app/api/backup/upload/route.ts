import {type NextRequest, NextResponse} from 'next/server';
import {v7 as uuid, validate} from 'uuid';

import {checkIpFrequency, getRecord, saveFile, setRecord, updateRecord} from '@/actions/backup';
import {FREQUENCY_TTL, MAX_DATA_SIZE} from '@/api/backup/constant';
import type {IBackupUploadBody, IBackupUploadSuccessResponse} from '@/api/backup/types';
import {getRequestMeta} from '@/api/backup/utils';
import {FILE_TYPE_JSON} from '@/utilities';

export async function POST(request: NextRequest) {
	const {contentType, ip, ua} = getRequestMeta(request);

	if (contentType !== FILE_TYPE_JSON) {
		return NextResponse.json({message: 'Invalid content type'}, {status: 400});
	}
	if (ip === null) {
		return NextResponse.json({message: 'Invalid IP address'}, {status: 400});
	}
	if (ua === null) {
		return NextResponse.json({message: 'Invalid user agent'}, {status: 400});
	}

	const json = (await request.json()) as Partial<IBackupUploadBody>;
	if (
		!('data' in json) ||
		!('customer_normal' in json.data) ||
		!('customer_rare' in json.data) ||
		!('user_id' in json)
	) {
		return NextResponse.json({message: 'Invalid object structure'}, {status: 400});
	}

	let code = uuid();
	if ('code' in json && typeof json.code === 'string') {
		const isValid = validate(json.code);
		if (isValid) {
			code = json.code;
		} else if (code !== 'null') {
			return NextResponse.json({message: 'Invalid code'}, {status: 400});
		}
	}

	const jsonString = JSON.stringify(json.data);
	if (jsonString.length > MAX_DATA_SIZE) {
		return NextResponse.json({message: 'The data is too large'}, {status: 413});
	}

	let userId = json.user_id ?? '';
	if (userId === 'null') {
		userId = '';
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency('created_at', now - FREQUENCY_TTL, {ip, ua, userId});
	if (recentRecord.status === 429) {
		return NextResponse.json({message: 'Requests are too frequent'}, {status: 429});
	}

	try {
		await saveFile(code, jsonString);
	} catch {
		return NextResponse.json({message: 'Failed to save file'}, {status: 500});
	}

	const record = await getRecord(code);
	if (record.status === 404) {
		await setRecord({
			code,
			created_at: now,
			ip_address: ip,
			last_accessed: -1,
			user_agent: ua,
			user_id: userId,
		});
	} else {
		await updateRecord(code, {
			created_at: now,
			ip_address: ip,
			user_agent: ua,
			user_id: userId,
		});
	}

	return NextResponse.json({code} satisfies IBackupUploadSuccessResponse);
}
