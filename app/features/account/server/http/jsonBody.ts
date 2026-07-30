import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_SMALL_JSON_BODY_BYTES } from '@/features/account/requestLimits';

import { readJsonBodyResult as readApiJsonBodyResult } from '@/infrastructure/http/server/responses';

export async function readJsonBodyResult<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
) {
	return readApiJsonBodyResult<T>(request, maxBytes);
}

export async function readJsonBody<T extends object>(
	request: NextRequest,
	maxBytes = MAX_ACCOUNT_SMALL_JSON_BODY_BYTES
) {
	const result = await readJsonBodyResult<T>(request, maxBytes);

	return result.status === 'ok' ? result.data : null;
}
