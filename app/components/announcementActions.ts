'use server';

import { type NextRequest } from 'next/server';

import {
	authenticateAccountFromRequest,
	verifyAccountCsrf,
} from '@/lib/account/server/auth';
import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';

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

async function checkDismissAnnouncementActionRequest(
	csrfToken: unknown,
	parts: ReadonlyArray<{ name: string; value: string }> = []
): Promise<
	| { request: NextRequest; status: 'ok' }
	| Extract<TAnnouncementActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const request = await createCurrentRequest('/announcements/action');
	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimitGuard(
		request,
		'announcement-dismiss',
		'',
		{ parts }
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

	const guard = await checkDismissAnnouncementActionRequest(csrfToken, [
		{ name: 'announcement', value: candidate.id },
	]);
	if (guard.status === 'error') {
		return guard;
	}

	const auth = await authenticateAccountFromRequest(guard.request);
	if (auth.status === 'error') {
		return { data: { message: 'announcement-dismissed' }, status: 'ok' };
	}
	if (!verifyAccountCsrf(guard.request, auth.data.sessionTokenHash)) {
		return createActionError('forbidden', 403);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.dismissAnnouncementForUser(
		candidate.id,
		candidate.updatedAt,
		auth.data.user.id
	);
	if (result.status === 'error') {
		return createActionError(
			result.error,
			announcementModule.ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return { data: result.data, status: 'ok' };
}
