import { type Kysely, type Transaction, sql } from 'kysely';

import { type TAnnouncementAudience } from '../shared/types';
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

export interface IListAnnouncementsOptions {
	includeArchived: boolean;
	limit: number;
	offset: number;
	query?: string;
}

export interface IListAnnouncementsResult {
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
	includeArchived,
	limit,
	offset,
	query: searchQuery,
}: IListAnnouncementsOptions): Promise<IListAnnouncementsResult> {
	const db = await getAccountDatabase();
	const normalizedSearchQuery = searchQuery?.trim().toLowerCase();
	let announcementsQuery = db.selectFrom(ANNOUNCEMENT_TABLE_NAME).selectAll();
	let archivedCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('archived_count'))
		.where('deleted_at', 'is not', null);
	let filteredCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('filtered_count'));
	let totalCountQuery = db
		.selectFrom(ANNOUNCEMENT_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'));

	if (!includeArchived) {
		announcementsQuery = announcementsQuery.where('deleted_at', 'is', null);
		filteredCountQuery = filteredCountQuery.where('deleted_at', 'is', null);
	}

	if (normalizedSearchQuery !== undefined && normalizedSearchQuery !== '') {
		const escapedSearchQuery = escapeLikePattern(normalizedSearchQuery);
		const likePattern = `%${escapedSearchQuery}%`;
		announcementsQuery = announcementsQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('title')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('html')} like ${likePattern} escape '\\'`,
			])
		);
		totalCountQuery = totalCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('title')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('html')} like ${likePattern} escape '\\'`,
			])
		);
		archivedCountQuery = archivedCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('title')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('html')} like ${likePattern} escape '\\'`,
			])
		);
		filteredCountQuery = filteredCountQuery.where((eb) =>
			eb.or([
				sql<boolean>`${sql.ref('title')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('id')} like ${likePattern} escape '\\'`,
				sql<boolean>`${sql.ref('html')} like ${likePattern} escape '\\'`,
			])
		);
	}

	const [
		announcements,
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
		archivedCountQuery.executeTakeFirstOrThrow(),
		filteredCountQuery.executeTakeFirstOrThrow(),
		totalCountQuery.executeTakeFirstOrThrow(),
	]);

	return {
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
