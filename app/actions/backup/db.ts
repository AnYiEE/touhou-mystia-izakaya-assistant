import { TABLE_NAME_MAP, db } from '@/lib/db';
import type {
	TBackupFileRecord,
	TBackupFileRecordNew,
	TBackupFileRecordUpdate,
} from '@/lib/db/types';

const TABLE_NAME = TABLE_NAME_MAP.backupFileRecord;

type TFileRecordWithStatus = Prettify<TBackupFileRecord & { status: 200 }>;

type TOtherStatus = 201 | 404 | 429 | 500;
interface IOtherStatus<T extends TOtherStatus> {
	status: T & TOtherStatus;
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

export async function checkIpFrequency<
	T extends 'created_at' | 'last_accessed',
>(
	column: T,
	time: TBackupFileRecord[T],
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
		.where(column, '>', time as never)
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
		.where('last_accessed', '<', time)
		.execute();

	return records;
}

export async function setRecord(backupFileRecord: TBackupFileRecordNew) {
	const record = await db
		.insertInto(TABLE_NAME)
		.values(backupFileRecord)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}

export async function updateRecord(
	code: TBackupFileRecord['code'],
	backupFileRecord: TBackupFileRecordUpdate
) {
	const record = await db
		.updateTable(TABLE_NAME)
		.set(backupFileRecord)
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record, 404);
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
