import { randomUUID } from 'node:crypto';

import {
	type IAdminAnnouncementBody,
	type IAdminAnnouncementCleanupData,
	type IAdminAnnouncementListData,
	type IAdminAnnouncementMutationData,
	type IAdminAnnouncementPreviewData,
	type IAdminAnnouncementProfile,
	type IAdminAnnouncementVersionListData,
	type IAnnouncementPublicItem,
	type IAnnouncementVisibleListData,
	type TAnnouncementAudience,
	type TAnnouncementComputedStatus,
	type TAnnouncementLevel,
	type TAnnouncementVersionAction,
	checkAnnouncementAudience,
	checkAnnouncementLevel,
} from '../shared/types';
import { createAnnouncementDismissalToken } from './dismissals';
import {
	createAnnouncementChangedFields,
	createAnnouncementVersionProfile,
} from './history';
import {
	type TCleanupAnnouncementRecordsAuditWriter,
	cleanupAnnouncementRecords,
	createAnnouncementRecord,
	getAnnouncementById,
	insertAnnouncementVersion,
	listActiveAnnouncementCandidates,
	listAnnouncementDismissalsForUser,
	listAnnouncementVersions,
	listAnnouncements,
	runAnnouncementTransaction,
	updateAnnouncementRecord,
	upsertAnnouncementDismissal,
} from './repository';
import {
	getAnnouncementVisibleText,
	renderAnnouncementHtmlTemplate,
	sanitizeAnnouncementHtml,
} from './sanitize';
import type { IAuditLogWriteInput } from '@/lib/account/server/repositories/auditLogs';
import {
	type TAuthenticatedSessionIdentity,
	lockActiveUserSessionInTransaction,
} from '@/lib/account/server/repositories/sessions';
import type {
	TAnnouncement,
	TAnnouncementNew,
	TAnnouncementVersionNew,
	TUser,
} from '@/lib/db/types';
import { getLogSafeErrorCode } from '@/lib/logging';

const DEFAULT_ANNOUNCEMENT_LIST_PAGE_SIZE = 20;
const DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT = 5;
const ACTIVE_CANDIDATE_BATCH_SIZE = 50;
const ACTIVE_CANDIDATE_CACHE_TTL_MS = 15 * 1000;
const ANNOUNCEMENT_DISMISSAL_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_KEEP_LATEST = 20;
const ANNOUNCEMENT_RECORD_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastAnnouncementRecordCleanupAt = 0;

const activeCandidateCache = new Map<
	string,
	{ expiresAt: number; records: TAnnouncement[] }
>();

export type TAnnouncementServiceError =
	| 'announcement-conflict'
	| 'announcement-not-found'
	| 'announcement-not-visible'
	| 'invalid-object-structure';

export type TAnnouncementServiceResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TAnnouncementServiceError; status: 'error' };

export const ANNOUNCEMENT_SERVICE_ERROR_STATUS_MAP: Record<
	TAnnouncementServiceError,
	number
> = {
	'announcement-conflict': 409,
	'announcement-not-found': 404,
	'announcement-not-visible': 400,
	'invalid-object-structure': 400,
};

export interface IAnnouncementRequestContext {
	dismissedTokens: string[];
	isAuthenticated: boolean;
	nickname?: TUser['nickname'];
	now?: number;
	userId?: TUser['id'];
	username?: TUser['username'];
}

export interface IListAdminAnnouncementsOptions {
	audience?: TAnnouncementAudience;
	computedStatus?: TAnnouncementComputedStatus;
	includeArchived?: boolean;
	level?: TAnnouncementLevel;
	page?: number;
	pageSize?: number;
	query?: string;
}

export interface ICleanupAdminAnnouncementRecordsOptions {
	adminId: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function checkAnnouncementConflictError(error: unknown) {
	if (error === null || typeof error !== 'object') {
		return false;
	}

	const code = Object.getOwnPropertyDescriptor(error, 'code')
		?.value as unknown;
	return (
		code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
		code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

function normalizeBooleanFlag(value: number) {
	return value === 1;
}

function createBooleanFlag(value: boolean) {
	return value ? 1 : 0;
}

function createMonotonicTimestamp(previousTimestamp: number) {
	return Math.max(Date.now(), previousTimestamp + 1);
}

function createVisibleAudienceList(isAuthenticated: boolean) {
	return isAuthenticated
		? (['all', 'authenticated', 'targeted'] as const)
		: (['all', 'anonymous'] as const);
}

function createActiveCandidateCacheKey({
	audiences,
	limit,
	offset = 0,
}: {
	audiences: ReadonlyArray<TAnnouncementAudience>;
	limit: number;
	offset?: number;
}) {
	return `${[...new Set(audiences)].sort().join(',')}:${limit}:${offset}`;
}

function checkAnnouncementIsActive(
	announcement: Pick<
		TAnnouncement,
		'deleted_at' | 'enabled' | 'ends_at' | 'starts_at'
	>,
	now: number
) {
	return (
		announcement.deleted_at === null &&
		announcement.enabled === 1 &&
		(announcement.starts_at === null || announcement.starts_at <= now) &&
		(announcement.ends_at === null || announcement.ends_at > now)
	);
}

function invalidateActiveAnnouncementCandidateCache() {
	activeCandidateCache.clear();
}

async function listCachedActiveAnnouncementCandidates({
	audiences,
	limit,
	now,
	offset = 0,
}: {
	audiences: TAnnouncementAudience[];
	limit: number;
	now: number;
	offset?: number;
}) {
	const key = createActiveCandidateCacheKey({ audiences, limit, offset });
	const cached = activeCandidateCache.get(key);
	if (cached !== undefined && cached.expiresAt > Date.now()) {
		return cached.records.filter((record) =>
			checkAnnouncementIsActive(record, now)
		);
	}

	const records = await listActiveAnnouncementCandidates({
		audiences,
		limit,
		now,
		offset,
	});
	activeCandidateCache.set(key, {
		expiresAt: Date.now() + ACTIVE_CANDIDATE_CACHE_TTL_MS,
		records,
	});

	return records;
}

function parseTargetUserIdsJson(value: string) {
	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) {
			return null;
		}

		const userIds: string[] = [];
		const seenIds = new Set<string>();
		for (const item of parsed) {
			if (typeof item !== 'string' || item.length === 0) {
				return null;
			}
			if (seenIds.has(item)) {
				continue;
			}

			seenIds.add(item);
			userIds.push(item);
		}

		return userIds;
	} catch {
		return null;
	}
}

interface IAnnouncementIdentityContext {
	isAuthenticated: boolean;
	userId: TUser['id'] | undefined;
}

function checkTargetUserMatch(targetUserIds: string[], userId: TUser['id']) {
	return targetUserIds.includes(userId);
}

function checkAnnouncementMatchesRequestContext(
	announcement: TAnnouncement,
	context: IAnnouncementIdentityContext
) {
	if (!checkAnnouncementAudience(announcement.audience)) {
		return false;
	}

	if (announcement.audience === 'all') {
		return true;
	}
	if (announcement.audience === 'anonymous') {
		return !context.isAuthenticated;
	}
	if (announcement.audience === 'authenticated') {
		return context.isAuthenticated;
	}
	if (!context.isAuthenticated || context.userId === undefined) {
		return false;
	}

	const targetUserIds = parseTargetUserIdsJson(
		announcement.target_user_ids_json
	);

	return (
		targetUserIds !== null &&
		checkTargetUserMatch(targetUserIds, context.userId)
	);
}

function getComputedAnnouncementStatus(
	announcement: Pick<
		TAnnouncement,
		'deleted_at' | 'enabled' | 'ends_at' | 'starts_at'
	>,
	now = Date.now()
): IAdminAnnouncementProfile['computed_status'] {
	if (announcement.deleted_at !== null) {
		return 'archived';
	}
	if (announcement.enabled !== 1) {
		return 'disabled';
	}
	if (announcement.starts_at !== null && announcement.starts_at > now) {
		return 'scheduled';
	}
	if (announcement.ends_at !== null && announcement.ends_at <= now) {
		return 'ended';
	}

	return 'active';
}

function createAdminAnnouncementProfile(
	announcement: TAnnouncement,
	now = Date.now()
): IAdminAnnouncementProfile | null {
	const targetUserIds = parseTargetUserIdsJson(
		announcement.target_user_ids_json
	);
	if (
		!checkAnnouncementLevel(announcement.level) ||
		!checkAnnouncementAudience(announcement.audience) ||
		targetUserIds === null
	) {
		return null;
	}

	return {
		audience: announcement.audience,
		computed_status: getComputedAnnouncementStatus(announcement, now),
		created_at: announcement.created_at,
		deleted_at: announcement.deleted_at,
		dismissible: normalizeBooleanFlag(announcement.dismissible),
		enabled: normalizeBooleanFlag(announcement.enabled),
		ends_at: announcement.ends_at,
		html: sanitizeAnnouncementHtml(announcement.html),
		id: announcement.id,
		level: announcement.level,
		priority: announcement.priority,
		revision: announcement.revision,
		starts_at: announcement.starts_at,
		target_user_ids: targetUserIds,
		title: announcement.title,
		updated_at: announcement.updated_at,
	};
}

function createPublicAnnouncementItem(
	announcement: TAnnouncement,
	sanitizedHtml: string
): IAnnouncementPublicItem | null {
	if (
		!checkAnnouncementLevel(announcement.level) ||
		!checkAnnouncementAudience(announcement.audience)
	) {
		return null;
	}

	return {
		audience: announcement.audience,
		dismissed_token: createAnnouncementDismissalToken(
			announcement.id,
			announcement.updated_at
		),
		dismissible: normalizeBooleanFlag(announcement.dismissible),
		ends_at: announcement.ends_at,
		html: sanitizedHtml,
		id: announcement.id,
		level: announcement.level,
		priority: announcement.priority,
		revision: announcement.revision,
		starts_at: announcement.starts_at,
		title: announcement.title,
		updated_at: announcement.updated_at,
	};
}

function createAnnouncementRecordFromBody(
	body: IAdminAnnouncementBody,
	now: number
) {
	return {
		audience: body.audience,
		created_at: now,
		deleted_at: null,
		dismissible: createBooleanFlag(body.dismissible),
		enabled: createBooleanFlag(body.enabled),
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

export async function getVisibleAnnouncementsForRequestContext({
	dismissedTokens,
	isAuthenticated,
	nickname,
	now = Date.now(),
	userId,
	username,
}: IAnnouncementRequestContext): Promise<IAnnouncementVisibleListData> {
	const audiences = createVisibleAudienceList(isAuthenticated);
	const announcements: IAnnouncementPublicItem[] = [];
	const dismissedTokenSet = new Set(dismissedTokens);
	let offset = 0;

	while (announcements.length < DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT) {
		const batch = await listCachedActiveAnnouncementCandidates({
			audiences: [...audiences],
			limit: ACTIVE_CANDIDATE_BATCH_SIZE,
			now,
			offset,
		});
		if (batch.length === 0) {
			break;
		}

		const visibleCandidates = batch.filter((announcement) =>
			checkAnnouncementMatchesRequestContext(announcement, {
				isAuthenticated,
				userId,
			})
		);
		const databaseDismissals =
			userId === undefined
				? []
				: await listAnnouncementDismissalsForUser(
						userId,
						visibleCandidates.map((announcement) => announcement.id)
					);
		const databaseDismissalTokenSet = new Set(
			databaseDismissals.map((dismissal) =>
				createAnnouncementDismissalToken(
					dismissal.announcement_id,
					dismissal.announcement_updated_at
				)
			)
		);

		for (const announcement of visibleCandidates) {
			const sanitizedHtml = sanitizeAnnouncementHtml(
				renderAnnouncementHtmlTemplate(announcement.html, {
					nickname: nickname ?? null,
					userId: userId ?? null,
					username: username ?? null,
				})
			);
			if (getAnnouncementVisibleText(sanitizedHtml).length === 0) {
				continue;
			}

			const item = createPublicAnnouncementItem(
				announcement,
				sanitizedHtml
			);
			if (item === null) {
				continue;
			}

			const isDismissed =
				item.dismissible &&
				(dismissedTokenSet.has(item.dismissed_token) ||
					databaseDismissalTokenSet.has(item.dismissed_token));
			if (isDismissed) {
				continue;
			}

			announcements.push(item);
			if (announcements.length >= DEFAULT_VISIBLE_ANNOUNCEMENT_LIMIT) {
				break;
			}
		}

		offset += batch.length;
	}

	return { active: announcements.length > 0, announcements };
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

function createAnnouncementRecordCleanupOptions(now: number) {
	return {
		dismissalBefore: now - ANNOUNCEMENT_DISMISSAL_RETENTION_MS,
		versionBefore: now - ANNOUNCEMENT_VERSION_RETENTION_MS,
		versionKeepLatest: ANNOUNCEMENT_VERSION_KEEP_LATEST,
	};
}

async function cleanupAnnouncementRecordsBestEffort(now = Date.now()) {
	if (
		now - lastAnnouncementRecordCleanupAt <
		ANNOUNCEMENT_RECORD_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAnnouncementRecordCleanupAt = now;
	try {
		await cleanupAnnouncementRecords(
			createAnnouncementRecordCleanupOptions(now)
		);
	} catch (error) {
		console.warn('Failed to clean up announcement records.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
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
		if (checkAnnouncementConflictError(error)) {
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
					dismissible: createBooleanFlag(body.dismissible),
					enabled: createBooleanFlag(body.enabled),
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
		if (checkAnnouncementConflictError(error)) {
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
		if (checkAnnouncementConflictError(error)) {
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
		if (checkAnnouncementConflictError(error)) {
			return { error: 'announcement-conflict', status: 'error' };
		}

		throw error;
	}
}

export async function dismissAnnouncementForUser(
	announcementId: string,
	announcementUpdatedAt: number,
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
): Promise<
	| TAnnouncementServiceResult<{ message: 'announcement-dismissed' }>
	| { status: 'unauthorized' }
> {
	return runAnnouncementTransaction(async (database) => {
		if (
			!(await lockActiveUserSessionInTransaction(
				database,
				userId,
				session
			))
		) {
			return { status: 'unauthorized' as const };
		}

		const announcement = await getAnnouncementById(
			announcementId,
			database
		);
		if (announcement === null) {
			return {
				error: 'announcement-not-found' as const,
				status: 'error' as const,
			};
		}
		if (
			announcement.updated_at !== announcementUpdatedAt ||
			announcement.dismissible !== 1
		) {
			return {
				error: 'announcement-not-visible' as const,
				status: 'error' as const,
			};
		}
		if (
			getComputedAnnouncementStatus(announcement) !== 'active' ||
			!checkAnnouncementMatchesRequestContext(announcement, {
				isAuthenticated: true,
				userId,
			})
		) {
			return {
				error: 'announcement-not-visible' as const,
				status: 'error' as const,
			};
		}

		await upsertAnnouncementDismissal(
			{
				announcement_id: announcement.id,
				announcement_updated_at: announcement.updated_at,
				dismissed_at: Date.now(),
				user_id: userId,
			},
			database
		);

		return {
			data: { message: 'announcement-dismissed' as const },
			status: 'ok' as const,
		};
	});
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

export async function cleanupAdminAnnouncementRecords({
	adminId,
	ipAddress,
	userAgent,
}: ICleanupAdminAnnouncementRecordsOptions): Promise<
	TAnnouncementServiceResult<IAdminAnnouncementCleanupData>
> {
	const now = Date.now();
	const auditModule = await import('@/lib/account/server/adminAuditService');
	const writeCleanupAuditLog: TCleanupAnnouncementRecordsAuditWriter = (
		database,
		auditNow,
		cleanupResult
	) => {
		const auditInput: IAuditLogWriteInput = {
			action: 'admin-cleanup-announcement-records',
			actorId: adminId,
			actorType: 'admin',
			metadata: {
				deleted_dismissals: cleanupResult.deletedDismissals,
				deleted_versions: cleanupResult.deletedVersions,
				dismissal_retention_ms: ANNOUNCEMENT_DISMISSAL_RETENTION_MS,
				version_keep_latest: ANNOUNCEMENT_VERSION_KEEP_LATEST,
				version_retention_ms: ANNOUNCEMENT_VERSION_RETENTION_MS,
			},
			scope: 'account',
			targetId: null,
			targetType: 'announcement_records',
		};
		if (ipAddress !== undefined) {
			auditInput.ipAddress = ipAddress;
		}
		if (userAgent !== undefined) {
			auditInput.userAgent = userAgent;
		}

		return auditModule.writeAdminAuditLogInTransaction(
			database,
			auditInput,
			auditNow
		);
	};
	const result = await cleanupAnnouncementRecords(
		createAnnouncementRecordCleanupOptions(now),
		writeCleanupAuditLog
	);

	return {
		data: {
			deleted_dismissals: result.deletedDismissals,
			deleted_versions: result.deletedVersions,
			message: 'announcement-records-cleaned',
		},
		status: 'ok',
	};
}
