import {NextRequest, NextResponse} from 'next/server';
import {v7 as uuid, validate} from 'uuid';

import {checkIpFrequency, getRecord, saveFile, setRecord, updateRecord} from '@/actions/backup';
import {FILE_TYPE_JSON} from '@/utilities';

export async function POST(request: NextRequest) {
	const contentType = request.headers.get('content-type');
	if (contentType !== FILE_TYPE_JSON) {
		return NextResponse.json({message: 'Invalid content type'}, {status: 400});
	}

	let ip =
		request.headers.get('x-real-ip')?.trim() || request.headers.get('x-forwarded-for')?.split(',').at(0)?.trim();
	if (ip === undefined) {
		return NextResponse.json({message: 'Invalid IP address'}, {status: 400});
	}
	if (ip.startsWith('::ffff:')) {
		ip = ip.slice(7);
	}

	const ua = request.headers.get('user-agent')?.trim();
	if (ua === undefined || ua.length === 0) {
		return NextResponse.json({message: 'Invalid user agent'}, {status: 400});
	}

	const json = (await request.json()) as Partial<{
		code: string | null;
		customer_normal: object;
		customer_rare: object;
	}>;
	if (!('customer_normal' in json) || !('customer_rare' in json)) {
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

	delete json.code;

	const jsonString = JSON.stringify(json);
	if (jsonString.length > 10 * 1024 * 1024) {
		return NextResponse.json({message: 'The data is too large'}, {status: 413});
	}

	const now = Date.now();
	const fiveMinutesAgo = now - 5 * 60 * 1000;

	const recentRecord = await checkIpFrequency(ip, ua, fiveMinutesAgo);
	if (recentRecord.status === 429) {
		return NextResponse.json({message: 'Requests are too frequent'}, {status: 429});
	}

	await saveFile(code, jsonString);

	const record = await getRecord(code);
	if (record.status === 404) {
		await setRecord({
			code,
			created_at: now,
			ip_address: ip,
			last_accessed: now,
			user_agent: ua,
		});
	} else {
		await updateRecord(code, {
			created_at: now,
			ip_address: ip,
			last_accessed: now,
			user_agent: ua,
		});
	}

	return NextResponse.json({code});
}
