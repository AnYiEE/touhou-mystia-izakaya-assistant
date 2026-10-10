import { type Transaction } from 'kysely';
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
	type IAnnouncementChangedField,
	type IAnnouncementLocalizedContent,
	type TAnnouncementComputedStatus,
	type TAnnouncementTranslations,
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
	TDatabase,
} from '@/infrastructure/database/schema';
import { checkSqlitePrimaryKeyOrUniqueConstraintError } from '@/infrastructure/database/sqlite/constraintErrors';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/shared/i18n/locale';
import { canIncrementNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	type IAdminAnnouncementMutationContext,
	type TAnnouncementMutationAuditAction,
	createAnnouncementMutationAuditInput,
	createAnnouncementUpdateAuditAction,
} from './audit';
import { cleanupAnnouncementRecordsBestEffort } from './cleanup';
import {
	createAnnouncementChangedFields,
	createAnnouncementVersionProfile,
} from './history';

const DEFAULT_ANNOUNCEMENT_LIST_PAGE_SIZE = 20;
const PREVIEW_SAMPLE_CONTEXT = {
	nickname: '夜雀',
	userId: '00000000-0000-0000-0000-000000000000',
	username: '米斯蒂娅',
} as const;

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
	return canIncrementNonNegativeSafeInteger(previousTimestamp)
		? Math.max(Date.now(), previousTimestamp + 1)
		: null;
}

function sanitizeAnnouncementTranslations(
	translations: TAnnouncementTranslations
): TAnnouncementTranslations {
	const sanitized: TAnnouncementTranslations = {};
	for (const locale of SUPPORTED_LOCALES) {
		const entry = translations[locale];
		if (entry !== undefined) {
			sanitized[locale] = {
				html: sanitizeAnnouncementHtml(entry.html),
				title: entry.title,
			};
		}
	}

	return sanitized;
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
		locales_json: JSON.stringify(body.locales),
		priority: body.priority,
		revision: 1,
		starts_at: body.starts_at,
		target_user_ids_json: JSON.stringify(body.target_user_ids),
		title: body.title,
		translations_json: JSON.stringify(
			sanitizeAnnouncementTranslations(body.translations)
		),
		updated_at: now,
	} satisfies TAnnouncementNew;
}

function createVersionRecord({
	action,
	announcement,
	changedBy,
	changedFields,
}: {
	action: TAnnouncementVersionAction;
	announcement: IAdminAnnouncementProfile;
	changedBy: string | null;
	changedFields: IAnnouncementChangedField[];
}) {
	return {
		action,
		announcement_id: announcement.id,
		changed_at: announcement.updated_at,
		changed_by: changedBy,
		changed_fields_json: JSON.stringify(changedFields),
		revision: announcement.revision,
		snapshot_json: JSON.stringify(announcement),
	} satisfies TAnnouncementVersionNew;
}

async function writeAnnouncementMutationAudit(
	database: Transaction<TDatabase>,
	context: IAdminAnnouncementMutationContext,
	{
		action,
		announcement,
		changedFields,
	}: {
		action: TAnnouncementMutationAuditAction;
		announcement: IAdminAnnouncementProfile;
		changedFields: IAnnouncementChangedField[];
	}
) {
	await context.writeAuditLog(
		database,
		createAnnouncementMutationAuditInput({
			action,
			actorId: context.changedBy,
			announcementId: announcement.id,
			changedFields: changedFields.map((field) => field.field),
			...(context.ipAddress === undefined
				? {}
				: { ipAddress: context.ipAddress }),
			revision: announcement.revision,
			...(context.userAgent === undefined
				? {}
				: { userAgent: context.userAgent }),
		}),
		announcement.updated_at
	);
}

function createPreviewProfile(body: IAdminAnnouncementBody) {
	const now = Date.now();
	const record = createAnnouncementRecordFromBody(
		{
			...body,
			html: renderAnnouncementHtmlTemplate(
				body.html,
				PREVIEW_SAMPLE_CONTEXT
			),
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
		return { error: 'announcement-invalid-state', status: 'error' };
	}

	return { data: { announcement: profile }, status: 'ok' };
}

export function previewAnnouncement(
	body: IAdminAnnouncementBody
): TAnnouncementServiceResult<IAdminAnnouncementPreviewData> {
	const profile = createPreviewProfile(body);
	if (profile === null) {
		return { error: 'announcement-invalid-state', status: 'error' };
	}

	const previewLocale = body.preview_locale ?? DEFAULT_LOCALE;
	const localized: IAnnouncementLocalizedContent | null =
		previewLocale === DEFAULT_LOCALE
			? { html: profile.html, title: profile.title }
			: (profile.translations[previewLocale] ?? null);

	if (previewLocale === DEFAULT_LOCALE && localized !== null) {
		const visibleTextLength = getAnnouncementVisibleText(
			localized.html
		).length;
		if (visibleTextLength > 0) {
			const isVisible =
				profile.locales.length === 0 ||
				profile.locales.includes(previewLocale);

			return {
				data: {
					computed_status: profile.computed_status,
					html: isVisible ? localized.html : '',
					is_visible: isVisible,
					locale: previewLocale,
					visible_text_length: isVisible ? visibleTextLength : 0,
				},
				status: 'ok',
			};
		}

		return { error: 'announcement-not-visible', status: 'error' };
	}

	if (
		localized === null ||
		(profile.locales.length > 0 && !profile.locales.includes(previewLocale))
	) {
		return {
			data: {
				computed_status: profile.computed_status,
				html: '',
				is_visible: false,
				locale: previewLocale,
				visible_text_length: 0,
			},
			status: 'ok',
		};
	}

	const sanitizedHtml = sanitizeAnnouncementHtml(
		renderAnnouncementHtmlTemplate(localized.html, PREVIEW_SAMPLE_CONTEXT)
	);
	const visibleTextLength = getAnnouncementVisibleText(sanitizedHtml).length;
	if (visibleTextLength === 0) {
		return {
			data: {
				computed_status: profile.computed_status,
				html: '',
				is_visible: false,
				locale: previewLocale,
				visible_text_length: 0,
			},
			status: 'ok',
		};
	}

	return {
		data: {
			computed_status: profile.computed_status,
			html: sanitizedHtml,
			is_visible: true,
			locale: previewLocale,
			visible_text_length: visibleTextLength,
		},
		status: 'ok',
	};
}

export async function createAdminAnnouncement(
	body: IAdminAnnouncementBody,
	context: IAdminAnnouncementMutationContext
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

			const changedFields = createAnnouncementChangedFields(
				null,
				nextProfile
			);
			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'create',
					announcement: nextProfile,
					changedBy: context.changedBy,
					changedFields,
				}),
				database
			);
			await writeAnnouncementMutationAudit(database, context, {
				action: 'admin-create-announcement',
				announcement: nextProfile,
				changedFields,
			});

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
			Error.isError(error) &&
			error.message === 'invalid-announcement-profile'
		) {
			return { error: 'announcement-invalid-state', status: 'error' };
		}

		throw error;
	}
}

export async function updateAdminAnnouncement(
	id: string,
	body: IAdminAnnouncementBody,
	context: IAdminAnnouncementMutationContext,
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
				return 'announcement-invalid-state';
			}
			if (body.expected_revision !== current.revision) {
				return 'announcement-conflict';
			}

			const now = createMonotonicTimestamp(current.updated_at);
			if (
				now === null ||
				!canIncrementNonNegativeSafeInteger(current.revision)
			) {
				return 'announcement-invalid-state';
			}
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
					locales_json: JSON.stringify(body.locales),
					priority: body.priority,
					revision: current.revision + 1,
					starts_at: body.starts_at,
					target_user_ids_json: JSON.stringify(body.target_user_ids),
					title: body.title,
					translations_json: JSON.stringify(
						sanitizeAnnouncementTranslations(body.translations)
					),
					updated_at: now,
				},
				{ database, expectedRevision: body.expected_revision }
			);
			if (updated === null) {
				return 'announcement-conflict';
			}

			const nextProfile = createAdminAnnouncementProfile(updated, now);
			if (nextProfile === null) {
				return 'announcement-invalid-state';
			}

			const changedFields = createAnnouncementChangedFields(
				previousProfile,
				nextProfile
			);
			await insertAnnouncementVersion(
				createVersionRecord({
					action,
					announcement: nextProfile,
					changedBy: context.changedBy,
					changedFields,
				}),
				database
			);
			await writeAnnouncementMutationAudit(database, context, {
				action: createAnnouncementUpdateAuditAction(
					previousProfile.enabled,
					nextProfile.enabled
				),
				announcement: nextProfile,
				changedFields,
			});

			return nextProfile;
		});

		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'announcement-invalid-state') {
			return { error: 'announcement-invalid-state', status: 'error' };
		}
		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
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
	context: IAdminAnnouncementMutationContext
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const current = await getAnnouncementById(id, database);
			if (current === null) {
				return 'announcement-not-found';
			}

			const previousProfile = createAdminAnnouncementProfile(current);
			if (previousProfile === null) {
				return 'announcement-invalid-state';
			}

			const now = createMonotonicTimestamp(current.updated_at);
			if (
				now === null ||
				!canIncrementNonNegativeSafeInteger(current.revision)
			) {
				return 'announcement-invalid-state';
			}
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
				return 'announcement-invalid-state';
			}

			const changedFields = createAnnouncementChangedFields(
				previousProfile,
				nextProfile
			);
			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'archive',
					announcement: nextProfile,
					changedBy: context.changedBy,
					changedFields,
				}),
				database
			);
			await writeAnnouncementMutationAudit(database, context, {
				action: 'admin-archive-announcement',
				announcement: nextProfile,
				changedFields,
			});

			return nextProfile;
		});

		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'announcement-invalid-state') {
			return { error: 'announcement-invalid-state', status: 'error' };
		}
		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
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
	context: IAdminAnnouncementMutationContext
): Promise<TAnnouncementServiceResult<IAdminAnnouncementMutationData>> {
	try {
		const profile = await runAnnouncementTransaction(async (database) => {
			const current = await getAnnouncementById(id, database);
			if (current === null) {
				return 'announcement-not-found';
			}

			const previousProfile = createAdminAnnouncementProfile(current);
			if (previousProfile === null) {
				return 'announcement-invalid-state';
			}
			if (current.deleted_at === null) {
				return previousProfile;
			}

			const now = createMonotonicTimestamp(current.updated_at);
			if (
				now === null ||
				!canIncrementNonNegativeSafeInteger(current.revision)
			) {
				return 'announcement-invalid-state';
			}
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
				return 'announcement-invalid-state';
			}

			const changedFields = createAnnouncementChangedFields(
				previousProfile,
				nextProfile
			);
			await insertAnnouncementVersion(
				createVersionRecord({
					action: 'restore',
					announcement: nextProfile,
					changedBy: context.changedBy,
					changedFields,
				}),
				database
			);
			await writeAnnouncementMutationAudit(database, context, {
				action: 'admin-restore-announcement',
				announcement: nextProfile,
				changedFields,
			});

			return nextProfile;
		});

		if (profile === 'announcement-conflict') {
			return { error: 'announcement-conflict', status: 'error' };
		}
		if (profile === 'announcement-invalid-state') {
			return { error: 'announcement-invalid-state', status: 'error' };
		}
		if (profile === 'announcement-not-found') {
			return { error: 'announcement-not-found', status: 'error' };
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
