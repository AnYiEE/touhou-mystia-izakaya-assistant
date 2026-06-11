import type { Transaction } from 'kysely';

import { TABLE_NAME_MAP } from '@/lib/db';
import { db } from '@/lib/db/db';
import type {
	TBackupFileRecord,
	TBackupFileRecordNew,
	TBackupFileRecordUpdate,
	TDatabase,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.backupFileRecord;
const IMPORT_TABLE_NAME = TABLE_NAME_MAP.backupImportRecord;

type TFileRecordWithStatus = Prettify<TBackupFileRecord & { status: 200 }>;
type TBackupRecordDatabase = typeof db | Transaction<TDatabase>;

type TOtherStatus = 201 | 404 | 429 | 500;
interface IOtherStatus<T extends TOtherStatus> {
	status: T;
}

type TResponse<T, U extends TOtherStatus> = T extends TBackupFileRecord
	? TFileRecordWithStatus
	: IOtherStatus<U>;

function generateResponse<
	T extends TBackupFileRecord | undefined,
	U extends TOtherStatus,
>(record: T, errorStatus?: U): TResponse<T, U> {
	if (record === undefined) {
		return { status: errorStatus ?? 500 } as TResponse<T, U>;
	}

	return { ...record, status: 200 } as TResponse<T, U>;
}

function checkMissingBackupImportTableError(error: unknown) {
	return (
		error instanceof Error &&
		/no such table:\s*backup_imports/iu.test(error.message)
	);
}

export async function checkIpFrequency(
	column: 'created_at' | 'last_accessed',
	time: TBackupFileRecord[typeof column],
	{
		ip,
		ua,
		userId,
	}: {
		ip: TBackupFileRecord['ip_address'];
		ua?: TBackupFileRecord['user_agent'];
		userId?: TBackupFileRecord['user_id'];
	}
) {
	let query = db
		.selectFrom(TABLE_NAME)
		.select('code')
		.where(column, '>', time)
		.where('ip_address', '=', ip);

	if (ua !== undefined) {
		query = query.where('user_agent', '=', ua);
	}
	if (userId !== undefined) {
		query = query.where('user_id', '=', userId);
	}

	const record = await query.executeTakeFirst();

	if (record === undefined) {
		return generateResponse(undefined, 201);
	}

	return generateResponse(undefined, 429);
}

export async function deleteRecord(
	code: TBackupFileRecord['code'],
	database: TBackupRecordDatabase = db
) {
	const record = await database
		.deleteFrom(TABLE_NAME)
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}

export async function getRecord(code: TBackupFileRecord['code']) {
	const record = await db
		.selectFrom(TABLE_NAME)
		.where('code', '=', code)
		.selectAll()
		.executeTakeFirst();

	return generateResponse(record, 404);
}

export async function getExpiredRecords(
	time: TBackupFileRecord['last_accessed']
) {
	const records = await db
		.selectFrom(TABLE_NAME)
		.select('code')
		.where((eb) =>
			eb.or([
				eb.and([
					eb('last_accessed', '>=', 0),
					eb('last_accessed', '<', time),
				]),
				eb.and([
					eb('last_accessed', '<', 0),
					eb('created_at', '<', time),
				]),
			])
		)
		.execute();

	return records;
}

export async function getRecordCodes() {
	const records = await db.selectFrom(TABLE_NAME).select('code').execute();

	return records.map((record) => record.code);
}

export async function getRecordFileReferences() {
	return await db
		.selectFrom(TABLE_NAME)
		.select(['code', 'file_name'])
		.execute();
}

export async function setRecord(
	backupFileRecord: TBackupFileRecordNew,
	database: TBackupRecordDatabase = db
) {
	const record = await database
		.insertInto(TABLE_NAME)
		.values(backupFileRecord)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}

export async function updateRecord(
	code: TBackupFileRecord['code'],
	backupFileRecord: TBackupFileRecordUpdate,
	database: TBackupRecordDatabase = db
) {
	const record = await database
		.updateTable(TABLE_NAME)
		.set(backupFileRecord)
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record, 404);
}

export async function deleteBackupImportRecordByCode(
	code: TBackupFileRecord['code'],
	database: TBackupRecordDatabase = db
) {
	let result;

	try {
		result = await database
			.deleteFrom(IMPORT_TABLE_NAME)
			.where('code', '=', code)
			.executeTakeFirst();
	} catch (error) {
		if (checkMissingBackupImportTableError(error)) {
			return 0;
		}

		throw error;
	}

	return Number(result.numDeletedRows);
}

export async function deleteExpiredBackupImportRecords(
	createdBefore: number,
	database: TBackupRecordDatabase = db
) {
	let result;

	try {
		result = await database
			.deleteFrom(IMPORT_TABLE_NAME)
			.where('created_at', '<', createdBefore)
			.executeTakeFirst();
	} catch (error) {
		if (checkMissingBackupImportTableError(error)) {
			return 0;
		}

		throw error;
	}

	return Number(result.numDeletedRows);
}

export async function updateRecordTimeout(
	code: TBackupFileRecord['code'],
	time: TBackupFileRecord['last_accessed'],
	database: TBackupRecordDatabase = db
) {
	const record = await database
		.updateTable(TABLE_NAME)
		.set({ last_accessed: time })
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}
