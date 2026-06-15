'use server';

import { cookies } from 'next/headers';

import { createCurrentRequest } from '@/lib/account/server/currentRequest';
import {
	type TAccountGuardResult,
	authenticateAdminSessionToken,
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
	checkAccountRateLimitGuard,
	checkAdminCsrfGuard,
	checkAdminFeatureGuard,
	checkSameOriginGuard,
} from '@/lib/account/server/guards';
import { ACCOUNT_COOKIE_NAME_MAP } from '@/lib/account/shared/constants';
import { parseAdminAnnouncementBody } from '@/lib/announcements/server/adminPayload';
import type {
	IAdminAnnouncementListData,
	IAdminAnnouncementMutationData,
	IAdminAnnouncementPreviewData,
	IAdminAnnouncementVersionListData,
} from '@/lib/announcements/shared/types';

export type TAdminAnnouncementActionResult<TData = Record<string, unknown>> =
	| { data: TData; status: 'ok' }
	| {
			data?: Record<string, unknown>;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

type TAdminAnnouncementActionScope =
	| 'admin-archive-announcement'
	| 'admin-create-announcement'
	| 'admin-list-announcement-versions'
	| 'admin-list-announcements'
	| 'admin-preview-announcement'
	| 'admin-restore-announcement'
	| 'admin-update-announcement';

interface IAdminAnnouncementAuthContext {
	username: string;
}

function createActionError(
	message: string,
	httpStatus: number,
	data?: Record<string, unknown>
): Extract<TAdminAnnouncementActionResult, { status: 'error' }> {
	return data === undefined
		? { httpStatus, message, status: 'error' }
		: { data, httpStatus, message, status: 'error' };
}

function createGuardActionError(
	result: Extract<TAccountGuardResult, { status: 'error' }>
) {
	return createActionError(result.message, result.httpStatus, result.data);
}

async function readAdminSessionToken() {
	const cookieStore = await cookies();

	return cookieStore.get(ACCOUNT_COOKIE_NAME_MAP.adminSession)?.value ?? null;
}

async function checkAdminAnnouncementActionRequest(
	scope: TAdminAnnouncementActionScope,
	csrfToken?: unknown
): Promise<
	| ({ status: 'ok' } & IAdminAnnouncementAuthContext)
	| Extract<TAdminAnnouncementActionResult, { status: 'error' }>
> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return createGuardActionError(accountFeatureResult);
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return createGuardActionError(adminFeatureResult);
	}

	const request = await createCurrentRequest('/admin/announcements/action');
	const sameOriginResult = checkSameOriginGuard(request);
	if (sameOriginResult.status === 'error') {
		return createGuardActionError(sameOriginResult);
	}

	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return createGuardActionError(cookieSecurityResult);
	}

	const rateLimitResult = checkAccountRateLimitGuard(request, scope);
	if (rateLimitResult.status === 'error') {
		return createGuardActionError(rateLimitResult);
	}

	const adminSessionToken = await readAdminSessionToken();
	const adminAuthResult = authenticateAdminSessionToken(adminSessionToken);
	if (adminAuthResult.status === 'error') {
		return createGuardActionError(adminAuthResult);
	}

	if (csrfToken !== undefined) {
		if (typeof csrfToken !== 'string') {
			return createActionError('forbidden', 403);
		}

		const csrfResult = checkAdminCsrfGuard(
			csrfToken,
			adminAuthResult.data.token
		);
		if (csrfResult.status === 'error') {
			return createGuardActionError(csrfResult);
		}
	}

	return { status: 'ok', username: adminAuthResult.data.payload.username };
}

export async function listAdminAnnouncementsAction(
	options: {
		includeArchived?: boolean;
		page?: number;
		pageSize?: number;
		query?: string;
	} = {}
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementListData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-list-announcements'
	);
	if (guard.status === 'error') {
		return guard;
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	return {
		data: await announcementModule.listAdminAnnouncements(options),
		status: 'ok',
	};
}

export async function getAdminAnnouncementAction(
	id: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementMutationData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-list-announcements'
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.getAdminAnnouncement(id);
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

export async function previewAnnouncementAction(
	body: unknown,
	csrfToken: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementPreviewData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-preview-announcement',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}

	const parsedBody = parseAdminAnnouncementBody(body);
	if (parsedBody === null) {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = announcementModule.previewAnnouncement(parsedBody);
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

export async function createAnnouncementAction(
	body: unknown,
	csrfToken: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementMutationData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-create-announcement',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}

	const parsedBody = parseAdminAnnouncementBody(body);
	if (parsedBody === null) {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.createAdminAnnouncement(
		parsedBody,
		guard.username
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

export async function updateAnnouncementAction(
	id: unknown,
	body: unknown,
	csrfToken: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementMutationData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-update-announcement',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const parsedBody = parseAdminAnnouncementBody(body);
	if (parsedBody?.id !== id) {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.updateAdminAnnouncement(
		id,
		parsedBody,
		guard.username
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

export async function archiveAnnouncementAction(
	id: unknown,
	csrfToken: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementMutationData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-archive-announcement',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.archiveAdminAnnouncement(
		id,
		guard.username
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

export async function restoreAnnouncementAction(
	id: unknown,
	csrfToken: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementMutationData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-restore-announcement',
		csrfToken
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.restoreAdminAnnouncement(
		id,
		guard.username
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

export async function listAnnouncementVersionsAction(
	id: unknown
): Promise<TAdminAnnouncementActionResult<IAdminAnnouncementVersionListData>> {
	const guard = await checkAdminAnnouncementActionRequest(
		'admin-list-announcement-versions'
	);
	if (guard.status === 'error') {
		return guard;
	}
	if (typeof id !== 'string') {
		return createActionError('invalid-object-structure', 400);
	}

	const announcementModule =
		await import('@/lib/announcements/server/service');
	const result = await announcementModule.listAdminAnnouncementVersions(id);
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
