import {type NextRequest, NextResponse} from 'next/server';
import {sha1} from 'js-sha1';
import {v7 as uuid, validate} from 'uuid';

import {checkIpFrequency, getRecord, saveFile, setRecord, updateRecord} from '@/actions/backup';
import type {IBackupUploadBody, IBackupUploadSuccessResponse} from '@/api/backup/types';
import {FILE_TYPE_JSON} from '@/utilities';

const MAX_DATA_SIZE = 10 * 1024 * 1024;
const FREQUENCY_CHECK_TTL = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
	const contentType = request.headers.get('content-type');
	if (contentType !== FILE_TYPE_JSON) {
		return NextResponse.json({message: 'Invalid content type'}, {status: 400});
	}

	let ip =
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		request.headers.get('x-real-ip')?.trim() || request.headers.get('x-forwarded-for')?.split(',').at(0)?.trim();
	if (ip === undefined) {
		return NextResponse.json({message: 'Invalid IP address'}, {status: 400});
	}
	if (ip.startsWith('::ffff:')) {
		ip = ip.slice(7);
	}
	ip = sha1(ip);

	let ua = request.headers.get('user-agent')?.trim();
	if (ua === undefined || ua.length === 0) {
		return NextResponse.json({message: 'Invalid user agent'}, {status: 400});
	}
	ua = sha1(ua);

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

	const now = Date.now();
	const userId = json.user_id ?? '';

	const recentRecord = await checkIpFrequency(now - FREQUENCY_CHECK_TTL, {ip, ua, userId});
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
			last_accessed: now,
			user_agent: ua,
			user_id: userId,
		});
	} else {
		await updateRecord(code, {
			created_at: now,
			ip_address: ip,
			last_accessed: now,
			user_agent: ua,
			user_id: userId,
		});
	}

	return NextResponse.json({code} satisfies IBackupUploadSuccessResponse);
}
