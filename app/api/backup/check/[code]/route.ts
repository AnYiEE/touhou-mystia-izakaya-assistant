import { type NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';

import { getRecord } from '@/actions/backup';
import type { IBackupCheckSuccessResponse } from '@/api/backup/types';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ code: string }> }
) {
	const { code } = await params;
	if (!validate(code)) {
		return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
	}

	const record = await getRecord(code);
	if (record.status === 404) {
		return NextResponse.json(
			{ message: 'The file record does not exist or has been deleted' },
			{ status: 404 }
		);
	}

	const { created_at, last_accessed } = record;

	return NextResponse.json({
		created_at,
		last_accessed,
	} satisfies IBackupCheckSuccessResponse);
}
