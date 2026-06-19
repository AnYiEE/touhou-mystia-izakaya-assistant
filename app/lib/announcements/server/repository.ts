import { type Kysely, type Transaction, sql } from 'kysely';

import {
	type TAnnouncementAudience,
	type TAnnouncementComputedStatus,
	type TAnnouncementLevel,
} from '../shared/types';
import { getAccountDatabase } from '@/lib/account/server/db';
import { TABLE_NAME_MAP } from '@/lib/db';
import type {
	TAnnouncement,
	TAnnouncementDismissal,
	TAnnouncementDismissalNew,
	TAnnouncementNew,
	TAnnouncementUpdate,
	TAnnouncementVersion,
	TAnnouncementVersionNew,
	TDatabase,
} from '@/lib/db/types';

const ANNOUNCEMENT_TABLE_NAME = TABLE_NAME_MAP.announcement;
const DISMISSAL_TABLE_NAME = TABLE_NAME_MAP.announcementDismissal;
const VERSION_TABLE_NAME = TABLE_NAME_MAP.announcementVersion;

type TAnnouncementDatabase = Kysely<TDatabase> | Transaction<TDatabase>;

async function getAnnouncementDatabase(database?: TAnnouncementDatabase) {
	return database ?? (await getAccountDatabase());
}

function escapeLikePattern(pattern: string) {
	return pattern.replaceAll(/[\\%_]/gu, (character) => `\\${character}`);
}

function normalizeTotalCount(value: number | string | bigint) {
	const totalCount = Number(value);

	if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
		throw new Error('invalid-announcement-count');
	}

	return totalCount;
}

function createActiveAnnouncementExpression(now: number) {
	return sql<boolean>`deleted_at is null and enabled = 1 and (starts_at is null or starts_at <= ${now}) and (ends_at is null or ends_at > ${now})`;
}

function createAnnouncementStatusExpression(
	status: TAnnouncementComputedStatus,
	now: number
) {
	switch (status) {
		case 'active':
			return createActiveAnnouncementExpression(now);
		case 'archived':
			return sql<boolean>`deleted_at is not null`;
		case 'disabled':
			return sql<boolean>`deleted_at is null and enabled != 1`;
		case 'ended':
			return sql<boolean>`deleted_at is null and enabled = 1 and ends_at is not null and ends_at <= ${now}`;
		case 'scheduled':
			return sql<boolean>`deleted_at is null and enabled = 1 and starts_at is not null and starts_at > ${now}`;
	}
}

function createSearchExpression(searchQuery: string) {
	const escapedSearchQuery = escapeLikePattern(searchQuery);
	const likePattern = `%${escapedSearchQuery}%`;

	return sql<boolean>`(title like ${likePattern} escape '\\' or id like ${likePattern} escape '\\' or html like ${likePattern} escape '\\')`;
}

export interface IListAnnouncementsOptions {
	audience?: TAnnouncementAudience;
	computedStatus?: TAnnouncementComputedStatus;
	includeArchived: boolean;
	level?: TAnnouncementLevel;
	limit: number;
	now: number;
	offset: number;
	query?: string;
}

export interface IListAnnouncementsResult {
	activeCount: number;
	archivedCount: number;
	announcements: TAnnouncement[];
	filteredCount: number;
	totalCount: number;
}

export interface IListActiveAnnouncementCandidatesOptions {
	audiences: TAnnouncementAudience[];
	limit: number;
	now: number;
	offset?: number;
}

export interface ICleanupAnnouncementRecordsOptions {
	dismissalBefore: number;
	versionBefore: number;
	versionKeepLatest: number;
}

export interface ICleanupAnnouncementRecordsResult {
	deletedDismissals: number;
	deletedVersions: number;
}

export type TCleanupAnnouncementRecordsAuditWriter = (
	database: Transaction<TDatabase>,
	now: number,
	result: ICleanupAnnouncementRecordsResult
) => Promise<void>;

export async function runAnnouncementTransaction<T>(
	callback: (database: Transaction<TDatabase>) => Promise<T>
) {
	const db = await getAccountDatabase();

	return db.transaction().execute(callback);
}

export async function listActiveAnnouncementCandidates({
	audiences,
	limit,
	now,
	offset = 0,
}: IListActiveAnnouncementCandidatesOptions) {
	if (audiences.length === 0) {
		return [];
	}

	const db = await getAnnouncementDatabase();

	return db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.selectAll()
		.where('audience', 'in', [...new Set(audiences)])
		.where('enabled', '=', 1)
		.where('deleted_at', 'is', null)
		.where((eb) =>
			eb.or([eb('starts_at', 'is', null), eb('starts_at', '<=', now)])
		)
		.where((eb) =>
			eb.or([eb('ends_at', 'is', null), eb('ends_at', '>', now)])
		)
		.orderBy('priority', 'desc')
		.orderBy(sql<number>`coalesce(starts_at, 0)`, 'desc')
		.orderBy('updated_at', 'desc')
		.orderBy('created_at', 'desc')
		.limit(limit)
		.offset(offset)
		.execute();
}

export async function listAnnouncements({
	audience,
	computedStatus,
	includeArchived,
	level,
	limit,
	now,
	offset,
	query: searchQuery,
}: IListAnnouncementsOptions): Promise<IListAnnouncementsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let announcementsQuery = db.selectFrom(ANNOUNCEMENT_TABLE_NAME).selectAll();
	const activeCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('active_count'))
		.where(createActiveAnnouncementExpression(now));
	const archivedCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('archived_count'))
		.where('deleted_at', 'is not', null);
	let filteredCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('filtered_count'));
	const totalCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (!includeArchived && computedStatus !== 'archived') {
		announcementsQuery = announcementsQuery.where('deleted_at', 'is', null);
		filteredCountQuery = filteredCountQuery.where('deleted_at', 'is', null);
	}
	if (computedStatus !== undefined) {
		announcementsQuery = announcementsQuery.where(
			createAnnouncementStatusExpression(computedStatus, now)
		);
		filteredCountQuery = filteredCountQuery.where(
			createAnnouncementStatusExpression(computedStatus, now)
		);
	}
	if (level !== undefined) {
		announcementsQuery = announcementsQuery.where('level', '=', level);
		filteredCountQuery = filteredCountQuery.where('level', '=', level);
	}
	if (audience !== undefined) {
		announcementsQuery = announcementsQuery.where(
			'audience',
			'=',
			audience
		);
		filteredCountQuery = filteredCountQuery.where(
			'audience',
			'=',
			audience
		);
	}

	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const searchExpression = createSearchExpression(normalizedSearchQuery);
		announcementsQuery = announcementsQuery.where(searchExpression);
		filteredCountQuery = filteredCountQuery.where(searchExpression);
	}

	const [
		announcements,
		activeCountRecord,
		archivedCountRecord,
		filteredCountRecord,
		totalCountRecord,
	] = await Promise.all([
		announcementsQuery
			.orderBy('updated_at', 'desc')
			.orderBy('created_at', 'desc')
			.orderBy('id', 'desc')
			.limit(limit)
			.offset(offset)
			.execute(),
		activeCountQuery.executeTakeFirstOrThrow(),
		archivedCountQuery.executeTakeFirstOrThrow(),
		filteredCountQuery.executeTakeFirstOrThrow(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
		activeCount: normalizeTotalCount(activeCountRecord.active_count),
		announcements,
		archivedCount: normalizeTotalCount(archivedCountRecord.archived_count),
		filteredCount: normalizeTotalCount(filteredCountRecord.filtered_count),
		totalCount: normalizeTotalCount(totalCountRecord.total_count),
	};
}

export async function getAnnouncementById(
	id: TAnnouncement['id'],
	database?: TAnnouncementDatabase
) {
	const db = await getAnnouncementDatabase(database);

	return (
		(await db
			.selectFrom(ANNOUNCEMENT_TABLE_NAME)
			.selectAll()
			.where('id', '=', id)
			.executeTakeFirst()) ?? null
	);
}

export async function createAnnouncementRecord(
	announcement: TAnnouncementNew,
	database?: TAnnouncementDatabase
) {
	const db = await getAnnouncementDatabase(database);

	return db
		.insertInto(ANNOUNCEMENT_TABLE_NAME)
		.values(announcement)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function updateAnnouncementRecord(
	id: TAnnouncement['id'],
	announcement: TAnnouncementUpdate,
	{
		database,
		expectedRevision,
	}: { database?: TAnnouncementDatabase; expectedRevision?: number } = {}
) {
	const db = await getAnnouncementDatabase(database);
	const query = db
		.updateTable(ANNOUNCEMENT_TABLE_NAME)
		.set(announcement)
		.where('id', '=', id);
	const revisionCheckedQuery =
		expectedRevision === undefined
			? query
			: query.where('revision', '=', expectedRevision);

	return (
		(await revisionCheckedQuery.returningAll().executeTakeFirst()) ?? null
	);
}

export async function listAnnouncementDismissalsForUser(
	userId: TAnnouncementDismissal['user_id'],
	announcementIds: Array<TAnnouncement['id']>
) {
	if (announcementIds.length === 0) {
		return [];
	}

	const db = await getAccountDatabase();

	return db
		.selectFrom(DISMISSAL_TABLE_NAME)
		.selectAll()
		.where('user_id', '=', userId)
		.where('announcement_id', 'in', [...new Set(announcementIds)])
		.execute();
}

export async function upsertAnnouncementDismissal(
	dismissal: TAnnouncementDismissalNew
) {
	const db = await getAccountDatabase();

	await db
		.insertInto(DISMISSAL_TABLE_NAME)
		.values(dismissal)
		.onConflict((oc) =>
			oc
				.columns([
					'user_id',
					'announcement_id',
					'announcement_updated_at',
				])
				.doUpdateSet({
					dismissed_at: sql<
						TAnnouncementDismissal['dismissed_at']
					>`excluded.dismissed_at`,
				})
		)
		.execute();
}

export async function insertAnnouncementVersion(
	version: TAnnouncementVersionNew,
	database?: TAnnouncementDatabase
) {
	const db = await getAnnouncementDatabase(database);

	await db.insertInto(VERSION_TABLE_NAME).values(version).execute();
}

export async function listAnnouncementVersions(
	announcementId: TAnnouncementVersion['announcement_id']
) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(VERSION_TABLE_NAME)
		.selectAll()
		.where('announcement_id', '=', announcementId)
		.orderBy('revision', 'desc')
		.orderBy('changed_at', 'desc')
		.execute();
}

export async function cleanupAnnouncementRecords(
	{
		dismissalBefore,
		versionBefore,
		versionKeepLatest,
	}: ICleanupAnnouncementRecordsOptions,
	writeAuditLog?: TCleanupAnnouncementRecordsAuditWriter
): Promise<ICleanupAnnouncementRecordsResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (database) => {
		const dismissalResult = await database
			.deleteFrom(DISMISSAL_TABLE_NAME)
			.where('dismissed_at', '<', dismissalBefore)
			.where((eb) =>
				eb.not(
					eb.exists(
						eb
							.selectFrom(ANNOUNCEMENT_TABLE_NAME)
							.select('id')
							.whereRef(
								`${ANNOUNCEMENT_TABLE_NAME}.id`,
								'=',
								`${DISMISSAL_TABLE_NAME}.announcement_id`
							)
							.whereRef(
								`${ANNOUNCEMENT_TABLE_NAME}.updated_at`,
								'=',
								`${DISMISSAL_TABLE_NAME}.announcement_updated_at`
							)
					)
				)
			)
			.executeTakeFirst();
		const versionRows = await database
			.selectFrom(VERSION_TABLE_NAME)
			.select(['id', 'announcement_id', 'revision', 'changed_at'])
			.orderBy('announcement_id', 'asc')
			.orderBy('revision', 'desc')
			.orderBy('changed_at', 'desc')
			.orderBy('id', 'desc')
			.execute();
		const keptCounts = new Map<
			TAnnouncementVersion['announcement_id'],
			number
		>();
		const versionIdsToDelete: Array<TAnnouncementVersion['id']> = [];

		for (const version of versionRows) {
			const keptCount = keptCounts.get(version.announcement_id) ?? 0;
			if (keptCount < versionKeepLatest) {
				keptCounts.set(version.announcement_id, keptCount + 1);
				continue;
			}

			if (version.changed_at < versionBefore) {
				versionIdsToDelete.push(version.id);
			}
		}

		let deletedVersions = 0;
		if (versionIdsToDelete.length > 0) {
			const versionResult = await database
				.deleteFrom(VERSION_TABLE_NAME)
				.where('id', 'in', versionIdsToDelete)
				.executeTakeFirst();
			deletedVersions = Number(versionResult.numDeletedRows);
		}

		const result = {
			deletedDismissals: Number(dismissalResult.numDeletedRows),
			deletedVersions,
		};
		await writeAuditLog?.(database, now, result);

		return result;
	});
}
