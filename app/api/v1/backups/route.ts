import { type NextRequest } from 'next/server';
import { v7 as uuid, validate } from 'uuid';

import {
	checkIpFrequency,
	getRecord,
	saveFile,
	setRecord,
	updateRecord,
} from '@/actions/backup';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL, MAX_DATA_SIZE } from './constants';
import type { IBackupUploadBody, IBackupUploadSuccessResponse } from './types';
import { getRequestMeta } from './utils';

export async function POST(request: NextRequest) {
	const { contentType, ip, ua } = getRequestMeta(request);

	if (contentType !== FILE_TYPE_JSON) {
		return createErrorResponse('Invalid content type', 400);
	}
	if (ip === null) {
		return createErrorResponse('Invalid IP address', 400);
	}
	if (ua === null) {
		return createErrorResponse('Invalid user agent', 400);
	}

	const json = (await request.json()) as Partial<IBackupUploadBody>;
	if (
		!('data' in json) ||
		!('customer_normal' in json.data) ||
		!('customer_rare' in json.data) ||
		!('user_id' in json)
	) {
		return createErrorResponse('Invalid object structure', 400);
	}

	let code = uuid();
	if ('code' in json && typeof json.code === 'string') {
		const isValid = validate(json.code);
		if (isValid) {
			code = json.code;
		} else if (json.code !== 'null') {
			return createErrorResponse('Invalid code', 400);
		}
	}

	const jsonString = JSON.stringify(json.data);
	if (jsonString.length > MAX_DATA_SIZE) {
		return createErrorResponse('The data is too large', 413);
	}

	let userId = json.user_id ?? '';
	if (userId === 'null') {
		userId = '';
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency(
		'created_at',
		now - FREQUENCY_TTL,
		{ ip, ua, userId }
	);
	if (recentRecord.status === 429) {
		return createErrorResponse('Requests are too frequent', 429);
	}

	try {
		await saveFile(code, jsonString);
	} catch {
		return createErrorResponse('Failed to save file', 500);
	}

	const record = await getRecord(code);

	await (record.status === 404
		? setRecord({
				code,
				created_at: now,
				ip_address: ip,
				last_accessed: -1,
				user_agent: ua,
				user_id: userId,
			})
		: updateRecord(code, {
				created_at: now,
				ip_address: ip,
				user_agent: ua,
				user_id: userId,
			}));

	return createJsonResponse({ code } satisfies IBackupUploadSuccessResponse);
}

export function OPTIONS() {
	return handleOptionsRequest();
}
