import { type NextRequest } from 'next/server';
import { v7 as uuid, validate } from 'uuid';

import {
	checkIpFrequency,
	getRecord,
	saveFile,
	setRecord,
	updateRecord,
	withBackupCodeLock,
} from '@/actions/backup';
import { readJsonBody } from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL, MAX_DATA_SIZE } from './constants';
import type { IBackupUploadBody, IBackupUploadSuccessResponse } from './types';
import { getRequestMeta } from './utils';

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
	const { contentType, ip, ua } = getRequestMeta(request);

	if (contentType !== FILE_TYPE_JSON) {
		return createNoStoreErrorResponse('Invalid content type', 400);
	}
	if (ip === null) {
		return createNoStoreErrorResponse('Invalid IP address', 400);
	}
	if (ua === null) {
		return createNoStoreErrorResponse('Invalid user agent', 400);
	}

	const json = await readJsonBody<IBackupUploadBody>(
		request,
		MAX_DATA_SIZE + 64 * 1024
	);
	const backupData = isPlainObject(json) ? json.data : null;
	const rawUserId = isPlainObject(json) ? json.user_id : null;
	if (
		!isPlainObject(json) ||
		!isPlainObject(backupData) ||
		!('customer_normal' in backupData) ||
		!('customer_rare' in backupData) ||
		!('user_id' in json) ||
		(typeof rawUserId !== 'string' && rawUserId !== null)
	) {
		return createNoStoreErrorResponse('Invalid object structure', 400);
	}

	let code = uuid();
	if ('code' in json && typeof json.code === 'string') {
		const normalizedCode = json.code.trim();
		const isValid = validate(normalizedCode);
		if (isValid) {
			code = normalizedCode;
		} else if (normalizedCode !== 'null') {
			return createNoStoreErrorResponse('Invalid code', 400);
		}
	}

	const jsonString = JSON.stringify(backupData);
	if (new Blob([jsonString]).size > MAX_DATA_SIZE) {
		return createNoStoreErrorResponse('The data is too large', 413);
	}

	let userId = rawUserId ?? '';
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
		return createNoStoreErrorResponse('Requests are too frequent', 429);
	}

	return withBackupCodeLock(code, async () => {
		try {
			await saveFile(code, jsonString);
		} catch {
			return createNoStoreErrorResponse('Failed to save file', 500);
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
					last_accessed: -1,
					user_agent: ua,
					user_id: userId,
				}));

		return createNoStoreJsonResponse({
			code,
		} satisfies IBackupUploadSuccessResponse);
	});
}

export function OPTIONS() {
	return handleOptionsRequest();
}
