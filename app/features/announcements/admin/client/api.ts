import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
} from '@/domain/announcements/contracts';

import {
	createAdminCsrfRequestInit,
	fetchAdminApiResult,
} from '@/features/admin/client/api';
import {
	appendAdminNumberSearchParam,
	appendAdminStringSearchParam,
	createAdminSearchSuffix,
} from '@/features/admin/client/searchParams';
import {
	type IAdminAnnouncementBody,
	type IAdminAnnouncementCleanupData,
	type IAdminAnnouncementListData,
	type IAdminAnnouncementMutationData,
	type IAdminAnnouncementPreviewData,
	type IAdminAnnouncementVersionListData,
	type TAnnouncementComputedStatus,
} from '@/features/announcements/contracts';

import { createJsonRequestInit } from '@/infrastructure/http/client/createJsonRequestInit';

export function listAdminAnnouncements(
	options: {
		audience?: TAnnouncementAudience | '';
		computedStatus?: TAnnouncementComputedStatus | '';
		includeArchived?: boolean;
		level?: TAnnouncementLevel | '';
		page?: number;
		pageSize?: number;
		query?: string;
	} = {}
) {
	const searchParams = new URLSearchParams();
	if (options.includeArchived === true) {
		searchParams.set('include_archived', '1');
	}
	appendAdminStringSearchParam(searchParams, 'audience', options.audience);
	appendAdminStringSearchParam(
		searchParams,
		'status',
		options.computedStatus
	);
	appendAdminStringSearchParam(searchParams, 'level', options.level);
	appendAdminNumberSearchParam(searchParams, 'page', options.page);
	appendAdminNumberSearchParam(searchParams, 'page_size', options.pageSize);
	appendAdminStringSearchParam(searchParams, 'query', options.query);

	return fetchAdminApiResult<IAdminAnnouncementListData>(
		`/api/v1/admin/announcements${createAdminSearchSuffix(searchParams)}`
	);
}

export function getAdminAnnouncement(id: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`
	);
}

export function previewAnnouncement(
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementPreviewData>(
		'/api/v1/admin/announcements/preview',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function createAnnouncement(
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		'/api/v1/admin/announcements',
		createJsonRequestInit('POST', body, csrfToken)
	);
}

export function updateAnnouncement(
	id: string,
	body: IAdminAnnouncementBody,
	csrfToken: string
) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createJsonRequestInit('PUT', body, csrfToken)
	);
}

export function archiveAnnouncement(id: string, csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function restoreAnnouncement(id: string, csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementMutationData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}`,
		createAdminCsrfRequestInit('PATCH', csrfToken)
	);
}

export function cleanupAdminAnnouncementRecords(csrfToken: string) {
	return fetchAdminApiResult<IAdminAnnouncementCleanupData>(
		'/api/v1/admin/announcements/cleanup',
		createAdminCsrfRequestInit('DELETE', csrfToken)
	);
}

export function listAnnouncementVersions(id: string) {
	return fetchAdminApiResult<IAdminAnnouncementVersionListData>(
		`/api/v1/admin/announcements/${encodeURIComponent(id)}/versions`
	);
}
