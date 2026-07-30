import { randomUUID } from 'node:crypto';

import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
	type TAnnouncementVersionAction,
} from '@/domain/announcements/contracts';

import {
	type IAdminAnnouncementBody,
	type IAdminAnnouncementListData,
	type IAdminAnnouncementMutationData,
	type IAdminAnnouncementPreviewData,
	type IAdminAnnouncementProfile,
	type IAdminAnnouncementVersionListData,
	type TAnnouncementComputedStatus,
} from '@/features/announcements/contracts';
import type { TAnnouncementServiceResult } from '@/features/announcements/server/contracts';
import {
	getAnnouncementVisibleText,
	renderAnnouncementHtmlTemplate,
	sanitizeAnnouncementHtml,
} from '@/features/announcements/server/html';
import {
	createAdminAnnouncementProfile,
	createAnnouncementBoolean,
} from '@/features/announcements/server/mappers';
import {
	createAnnouncementRecord,
	getAnnouncementById,
	insertAnnouncementVersion,
	listAnnouncementVersions,
	listAnnouncements,
	runAnnouncementTransaction,
	updateAnnouncementRecord,
} from '@/features/announcements/server/persistence/repository';
import { invalidateActiveAnnouncementCandidateCache } from '@/features/announcements/server/public/service';

import type {
	TAnnouncementNew,
	TAnnouncementVersionNew,
} from '@/infrastructure/database/schema';
import { checkSqlitePrimaryKeyOrUniqueConstraintError } from '@/infrastructure/database/sqlite/constraintErrors';

import { cleanupAnnouncementRecordsBestEffort } from './cleanup';
import {
	createAnnouncementChangedFields,
	createAnnouncementVersionProfile,
} from './history';

const DEFAULT_ANNOUNCEMENT_LIST_PAGE_SIZE = 20;

export interface IListAdminAnnouncementsOptions {
	audience?: TAnnouncementAudience;
	computedStatus?: TAnnouncementComputedStatus;
	includeArchived?: boolean;
	level?: TAnnouncementLevel;
	page?: number;
	pageSize?: number;
	query?: string;
}

function createMonotonicTimestamp(previousTimestamp: number) {
	return Math.max(Date.now(), previousTimestamp + 1);
}

function createAnnouncementRecordFromBody(
	body: IAdminAnnouncementBody,
	now: number
) {
	return {
		audience: body.audience,
		created_at: now,
		deleted_at: null,
		dismissible: createAnnouncementBoolean(body.dismissible),
		enabled: createAnnouncementBoolean(body.enabled),
		ends_at: body.ends_at,
		html: sanitizeAnnouncementHtml(body.html),
		id: body.id ?? randomUUID(),
		level: body.level,
		priority: body.priority,
		revision: 1,
		starts_at: body.starts_at,
		target_user_ids_json: JSON.stringify(body.target_user_ids),
		title: body.title,
		updated_at: now,
	} satisfies TAnnouncementNew;
}

function createVersionRecord({
	action,
	announcement,
	changedBy,
	previous,
}: {
	action: TAnnouncementVersionAction;
	announcement: IAdminAnnouncementProfile;
	changedBy: string | null;
	previous: IAdminAnnouncementProfile | null;
}) {
	return {
		action,
		announcement_id: announcement.id,
		changed_at: announcement.updated_at,
		changed_by: changedBy,
		changed_fields_json: JSON.stringify(
			createAnnouncementChangedFields(previous, announcement)
		),
		revision: announcement.revision,
		snapshot_json: JSON.stringify(announcement),
	} satisfies TAnnouncementVersionNew;
}

function createPreviewProfile(body: IAdminAnnouncementBody) {
	const now = Date.now();
	const record = createAnnouncementRecordFromBody(
		{
			...body,
			html: renderAnnouncementHtmlTemplate(body.html, {
				nickname: '夜雀',
				userId: '00000000-0000-0000-0000-000000000000',
				username: '米斯蒂娅',
			}),
		},
		now
	);

	return createAdminAnnouncementProfile(record, now);
}

export async function listAdminAnnouncements({
	audience,
	computedStatus,
	includeArchived = false,
	level,
	page = 1,
	pageSize = DEFAULT_ANNOUNCEMENT_LIST_PAGE_SIZE,
	query = '',
}: IListAdminAnnouncementsOptions = {}): Promise<IAdminAnnouncementListData> {
	const safePage = Math.max(1, page);
	const safePageSize = Math.max(1, pageSize);
	const now = Date.now();
	const {
		activeCount,
		announcements,
		archivedCount,
		filteredCount,
		totalCount,
	} = await listAnnouncements({
		...(audience === undefined ? {} : { audience }),
		...(computedStatus === undefined ? {} : { computedStatus }),
		...(level === undefined ? {} : { level }),
		includeArchived,
		limit: safePageSize,
		now,
		offset: (safePage - 1) * safePageSize,
		query,
	});
	const profiles = announcements.flatMap((announcement) => {
		const profile = createAdminAnnouncementProfile(announcement, now);

		return profile === null ? [] : [profile];
	});
	return {
		active_count: activeCount,
		announcements: profiles,
		archived_count: archivedCount,
		filtered_count: filteredCount,
		page: safePage,
		page_size: safePageSize,
		total_count: totalCount,
		total_pages: Math.ceil(filteredCount / safePageSize),
	};
}

export async function getAdminAnnouncement(
	id: string
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	const announcement = await getAnnouncementById(id);
	if (announcement === null) {
		return { error: 'announcement-not-found', status: 'error' };
	}

	const profile = createAdminAnnouncementProfile(announcement);
	if (profile === null) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	return { data: { announcement: profile }, status: 'ok' };
}

export function previewAnnouncement(
	body: IAdminAnnouncementBody
): TAnnouncementServiceResult<IAdminAnnouncementPreviewData> {
	const profile = createPreviewProfile(body);
	if (
		profile === null ||
		getAnnouncementVisibleText(profile.html).length === 0
	) {
		return { error: 'announcement-not-visible', status: 'error' };
	}

	return {
		data: {
			computed_status: profile.computed_status,
			html: profile.html,
			visible_text_length: getAnnouncementVisibleText(profile.html)
				.length,
		},
		status: 'ok',
	};
}

export async function createAdminAnnouncement(
	body: IAdminAnnouncementBody,
	changedBy: string | null
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	const sanitizedHtml = sanitizeAnnouncementHtml(body.html);
	if (getAnnouncementVisibleText(sanitizedHtml).length === 0) {
		return { error: 'announcement-not-visible', status: 'error' };
	}

	const now = Date.now();
	const record = createAnnouncementRecordFromBody(
		{ ...body, enabled: body.enabled, html: sanitizedHtml },
		now
	);

	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const created = await createAnnouncementRecord(record, database);
			const nextProfile = createAdminAnnouncementProfile(created, now);
			if (nextProfile === null) {
				throw new Error('invalid-announcement-profile');
			}

			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'create',
					announcement: nextProfile,
					changedBy,
					previous: null,
				}),
				database
			);

			return nextProfile;
		});

		invalidateActiveAnnouncementCandidateCache();
		void cleanupAnnouncementRecordsBestEffort();

		return { data: { announcement: profile }, status: 'ok' };
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (
			error instanceof Error &&
			error.message === 'invalid-announcement-profile'
		) {
			return { error: 'invalid-object-structure', status: 'error' };
		}

		throw error;
	}
}

export async function updateAdminAnnouncement(
	id: string,
	body: IAdminAnnouncementBody,
	changedBy: string | null,
	action: TAnnouncementVersionAction = 'update'
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	const sanitizedHtml = sanitizeAnnouncementHtml(body.html);
	if (getAnnouncementVisibleText(sanitizedHtml).length === 0) {
		return { error: 'announcement-not-visible', status: 'error' };
	}
	if (body.expected_revision === undefined) {
		return { error: 'invalid-object-structure', status: 'error' };
	}

	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const current = await getAnnouncementById(id, database);
			if (current === null) {
				return 'announcement-not-found';
			}

			const previousProfile = createAdminAnnouncementProfile(current);
			if (previousProfile === null) {
				return 'invalid-object-structure';
			}
			if (body.expected_revision !== current.revision) {
				return 'announcement-conflict';
			}

			const now = createMonotonicTimestamp(current.updated_at);
			const updated = await updateAnnouncementRecord(
				id,
				{
					audience: body.audience,
					deleted_at: current.deleted_at,
					dismissible: createAnnouncementBoolean(body.dismissible),
					enabled: createAnnouncementBoolean(body.enabled),
					ends_at: body.ends_at,
					html: sanitizedHtml,
					level: body.level,
					priority: body.priority,
					revision: current.revision + 1,
					starts_at: body.starts_at,
					target_user_ids_json: JSON.stringify(body.target_user_ids),
					title: body.title,
					updated_at: now,
				},
				{ database, expectedRevision: body.expected_revision }
			);
			if (updated === null) {
				return 'announcement-conflict';
			}

			const nextProfile = createAdminAnnouncementProfile(updated, now);
			if (nextProfile === null) {
				return 'invalid-object-structure';
			}

			await insertAnnouncementVersion(
				createVersionRecord({
					action,
					announcement: nextProfile,
					changedBy,
					previous: previousProfile,
				}),
				database
			);

			return nextProfile;
		});

		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
		}
		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'invalid-object-structure') {
			return { error: 'invalid-object-structure', status: 'error' };
		}

		invalidateActiveAnnouncementCandidateCache();
		void cleanupAnnouncementRecordsBestEffort();

		return { data: { announcement: profile }, status: 'ok' };
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return { error: 'announcement-conflict', status: 'error' };
		}

		throw error;
	}
}

export async function archiveAdminAnnouncement(
	id: string,
	changedBy: string | null
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const current = await getAnnouncementById(id, database);
			if (current === null) {
				return 'announcement-not-found';
			}

			const previousProfile = createAdminAnnouncementProfile(current);
			if (previousProfile === null) {
				return 'invalid-object-structure';
			}

			const now = createMonotonicTimestamp(current.updated_at);
			const updated = await updateAnnouncementRecord(
				id,
				{
					deleted_at: current.deleted_at ?? now,
					revision: current.revision + 1,
					updated_at: now,
				},
				{ database, expectedRevision: current.revision }
			);
			if (updated === null) {
				return 'announcement-conflict';
			}

			const nextProfile = createAdminAnnouncementProfile(updated, now);
			if (nextProfile === null) {
				return 'invalid-object-structure';
			}

			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'archive',
					announcement: nextProfile,
					changedBy,
					previous: previousProfile,
				}),
				database
			);

			return nextProfile;
		});

		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
		}
		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'invalid-object-structure') {
			return { error: 'invalid-object-structure', status: 'error' };
		}

		invalidateActiveAnnouncementCandidateCache();
		void cleanupAnnouncementRecordsBestEffort();

		return { data: { announcement: profile }, status: 'ok' };
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return { error: 'announcement-conflict', status: 'error' };
		}

		throw error;
	}
}

export async function restoreAdminAnnouncement(
	id: string,
	changedBy: string | null
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const current = await getAnnouncementById(id, database);
			if (current === null) {
				return 'announcement-not-found';
			}

			const previousProfile = createAdminAnnouncementProfile(current);
			if (previousProfile === null) {
				return 'invalid-object-structure';
			}
			if (current.deleted_at === null) {
				return previousProfile;
			}

			const now = createMonotonicTimestamp(current.updated_at);
			const updated = await updateAnnouncementRecord(
				id,
				{
					deleted_at: null,
					revision: current.revision + 1,
					updated_at: now,
				},
				{ database, expectedRevision: current.revision }
			);
			if (updated === null) {
				return 'announcement-conflict';
			}

			const nextProfile = createAdminAnnouncementProfile(updated, now);
			if (nextProfile === null) {
				return 'invalid-object-structure';
			}

			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'restore',
					announcement: nextProfile,
					changedBy,
					previous: previousProfile,
				}),
				database
			);

			return nextProfile;
		});

		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
		}
		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'invalid-object-structure') {
			return { error: 'invalid-object-structure', status: 'error' };
		}

		invalidateActiveAnnouncementCandidateCache();
		void cleanupAnnouncementRecordsBestEffort();

		return { data: { announcement: profile }, status: 'ok' };
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return { error: 'announcement-conflict', status: 'error' };
		}

		throw error;
	}
}

export async function listAdminAnnouncementVersions(
	announcementId: string
): Promise<TAnnouncementServiceResult<IAdminAnnouncementVersionListData>> {
	const announcement = await getAnnouncementById(announcementId);
	if (announcement === null) {
		return { error: 'announcement-not-found', status: 'error' };
	}

	const versions = await listAnnouncementVersions(announcementId);

	return {
		data: {
			versions: versions.flatMap((version) => {
				const profile = createAnnouncementVersionProfile(version);

				return profile === null ? [] : [profile];
			}),
		},
		status: 'ok',
	};
}
