'use server';

import { type NextRequest } from 'next/server';

import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	checkAccountCookieSecurity,
	checkAccountFeature,
	checkAccountRateLimit,
	checkSameOrigin,
} from '@/lib/account/server/guards';
import {
	authenticateAccountRequest,
	verifyAccountCsrf,
} from '@/lib/account/server/auth';
import {
	ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP,
	type TAnnouncementServiceError,
	dismissAnnouncementForUser,
} from '@/lib/announcements/server/service';

export type TAnnouncementActionResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

function createActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAnnouncementActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

function createServiceActionError(error: TAnnouncementServiceError) {
	return createActionError(
		error,
		ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[error]
	);
}

async function checkDismissAnnouncementActionRequest(
	csrfToken: unknown
): Promise<
	| { request: NextRequest; status: 'ok' }
	| Extract<TAnnouncementActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeature();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const request = await createCurrentRequest('/announcements/action');
	const sameOriginResult = checkSameOrigin(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurity(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimit(
		request,
		'announcement-dismiss'
	);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	if (csrfToken !== undefined && typeof csrfToken !== 'string') {
		return createActionError('forbidden', 403);
	}

	return { request, status: 'ok' };
}

export async function dismissAnnouncementAction(
	body: unknown,
	csrfToken?: unknown
): Promise<TAnnouncementActionResult<{ message: 'announcement-dismissed' }>> {
	if (body === null || typeof body !== 'object') {
		return createActionError('invalid-object-structure', 400);
	}

	const candidate = body as Partial<{ id: unknown; updatedAt: unknown }>;
	if (
		typeof candidate.id !== 'string' ||
		typeof candidate.updatedAt !== 'number' ||
		!Number.isSafeInteger(candidate.updatedAt)
	) {
		return createActionError('invalid-object-structure', 400);
	}

	const guard = await checkDismissAnnouncementActionRequest(csrfToken);
	if (guard.status === 'error') {
		return guard;
	}

	const auth = await authenticateAccountRequest(guard.request);
	if (auth.status === 'error') {
		return { data: { message: 'announcement-dismissed' }, status: 'ok' };
	}
	if (!verifyAccountCsrf(guard.request, auth.data.sessionTokenHash)) {
		return createActionError('forbidden', 403);
	}

	const result = await dismissAnnouncementForUser(
		candidate.id,
		candidate.updatedAt,
		auth.data.user.id
	);
	if (result.status === 'error') {
		return createServiceActionError(result.error);
	}

	return { data: result.data, status: 'ok' };
}
