import { TABLE_NAME_MAP } from '@/lib/db';
import { db } from '@/lib/db/db';
import type {
	TBackupFileRecord,
	TBackupFileRecordNew,
	TBackupFileRecordUpdate,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.backupFileRecord;
const IMPORT_TABLE_NAME = TABLE_NAME_MAP.backupImportRecord;

type TFileRecordWithStatus = Prettify<TBackupFileRecord & { status: 200 }>;

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

export async function checkIpFrequency(
	column: 'created_at' | 'last_accessed',
	time: TBackupFileRecord[typeof column],
	{
		ip,
		ua,
		userId,
	}: {
		ip: TBackupFileRecord['ip_address'];
		ua: TBackupFileRecord['user_agent'];
		userId: TBackupFileRecord['user_id'];
	}
) {
	const record = await db
		.selectFrom(TABLE_NAME)
		.select('code')
		.where(column, '>', time)
		.where('ip_address', '=', ip)
		.where('user_agent', '=', ua)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	if (record === undefined) {
		return generateResponse(undefined, 201);
	}

	return generateResponse(undefined, 429);
}

export async function deleteRecord(code: TBackupFileRecord['code']) {
	const record = await db
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

export async function setRecord(backupFileRecord: TBackupFileRecordNew) {
	const record = await db.transaction().execute(async (trx) => {
		const nextRecord = await trx
			.insertInto(TABLE_NAME)
			.values(backupFileRecord)
			.returningAll()
			.executeTakeFirst();
		if (nextRecord !== undefined) {
			await trx
				.deleteFrom(IMPORT_TABLE_NAME)
				.where('code', '=', backupFileRecord.code)
				.execute();
		}

		return nextRecord;
	});

	return generateResponse(record);
}

export async function updateRecord(
	code: TBackupFileRecord['code'],
	backupFileRecord: TBackupFileRecordUpdate
) {
	const record = await db.transaction().execute(async (trx) => {
		const nextRecord = await trx
			.updateTable(TABLE_NAME)
			.set(backupFileRecord)
			.where('code', '=', code)
			.returningAll()
			.executeTakeFirst();
		if (nextRecord !== undefined) {
			await trx
				.deleteFrom(IMPORT_TABLE_NAME)
				.where('code', '=', code)
				.execute();
		}

		return nextRecord;
	});

	return generateResponse(record, 404);
}

export async function deleteExpiredBackupImportRecords(createdBefore: number) {
	const result = await db
		.deleteFrom(IMPORT_TABLE_NAME)
		.where('created_at', '<', createdBefore)
		.executeTakeFirst();

	return Number(result.numDeletedRows);
}

export async function updateRecordTimeout(
	code: TBackupFileRecord['code'],
	time: TBackupFileRecord['last_accessed']
) {
	const record = await db
		.updateTable(TABLE_NAME)
		.set({ last_accessed: time })
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}
