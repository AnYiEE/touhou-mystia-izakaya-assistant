import { type NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';

import {
	checkIpFrequency,
	deleteFile,
	deleteRecord,
	getFile,
	getRecord,
	updateRecordTimeout,
} from '@/actions/backup';
import {
	createErrorResponse,
	createJsonResponse,
	handleOptionsRequest,
} from '@/api/v1/utils';
import { FILE_TYPE_JSON } from '@/utilities';
import { FREQUENCY_TTL } from '../constants';
import { getRequestMeta } from '../utils';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code } = await params;
	if (!validate(code)) {
		return createErrorResponse('Invalid code', 400);
	}

	const { ip, ua } = getRequestMeta(request);
	if (ip === null) {
		return createErrorResponse('Invalid IP address', 400);
	}
	if (ua === null) {
		return createErrorResponse('Invalid user agent', 400);
	}

	let userId = request.nextUrl.searchParams.get('user_id') ?? '';
	if (userId === 'null') {
		userId = '';
	}

	const now = Date.now();

	const recentRecord = await checkIpFrequency(
		'last_accessed',
		now - FREQUENCY_TTL,
		{ ip, ua, userId }
	);
	if (recentRecord.status === 429) {
		return createErrorResponse('Requests are too frequent', 429);
	}

	const { status } = await getRecord(code);
	if (status === 404) {
		return createErrorResponse(
			'The file record does not exist or has been deleted',
			404
		);
	}

	await updateRecordTimeout(code, now);

	let fileContent: string;
	try {
		fileContent = await getFile(code);
	} catch {
		return createErrorResponse(
			'The file does not exist or has been deleted',
			404
		);
	}

	return new NextResponse(fileContent, {
		headers: { 'Content-Type': FILE_TYPE_JSON },
	});
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code } = await params;
	if (!validate(code)) {
		return createErrorResponse('Invalid code', 400);
	}

	const { status } = await getRecord(code);
	if (status === 404) {
		return createErrorResponse(
			'The file record does not exist or has been deleted',
			404
		);
	}

	try {
		await deleteFile(code);
		await deleteRecord(code);
	} catch {
		return createErrorResponse('Failed to delete file', 500);
	}

	return createJsonResponse({ message: 'The file record has been deleted' });
}

export function OPTIONS() {
	return handleOptionsRequest();
}
