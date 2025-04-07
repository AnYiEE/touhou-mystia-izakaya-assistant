import {TABLE_NAME_BACKUP_FILE_RECORD as TABLE_NAME, db} from '@/lib';
import type {IBackupFileRecord, IBackupFileRecordNew, IBackupFileRecordUpdate} from '@/lib/types';

type TFileRecordWithStatus = IBackupFileRecord & {
	status: 200;
};

type TOtherStatus = 201 | 404 | 429 | 500;
interface IOtherStatus<T extends TOtherStatus> {
	status: T & TOtherStatus;
}

type TResponse<T, U extends TOtherStatus> = T extends IBackupFileRecord ? TFileRecordWithStatus : IOtherStatus<U>;

function generateResponse<T extends IBackupFileRecord | undefined, U extends TOtherStatus>(
	record: T,
	errorStatus?: U
): TResponse<T, U> {
	if (record === undefined) {
		return {
			status: errorStatus ?? 500,
		} as TResponse<T, U>;
	}

	return {
		...record,
		status: 200,
	} as TResponse<T, U>;
}

export async function checkIpFrequency(ip: IBackupFileRecord['ip_address'], time: IBackupFileRecord['created_at']) {
	const record = await db
		.selectFrom(TABLE_NAME)
		.select('code')
		.where('ip_address', '=', ip)
		.where('created_at', '>', time)
		.executeTakeFirst();

	if (record === undefined) {
		return generateResponse(undefined, 201);
	}

	return generateResponse(undefined, 429);
}

export async function deleteRecord(code: IBackupFileRecord['code']) {
	const record = await db.deleteFrom(TABLE_NAME).where('code', '=', code).returningAll().executeTakeFirst();

	return generateResponse(record);
}

export async function getRecord(code: IBackupFileRecord['code']) {
	const record = await db.selectFrom(TABLE_NAME).where('code', '=', code).selectAll().executeTakeFirst();

	return generateResponse(record, 404);
}

export async function getExpiredRecords(time: IBackupFileRecord['last_accessed']) {
	const records = await db.selectFrom(TABLE_NAME).select('code').where('last_accessed', '<', time).execute();

	return records;
}

export async function setRecord(backupFileRecord: IBackupFileRecordNew) {
	const record = await db.insertInto(TABLE_NAME).values(backupFileRecord).returningAll().executeTakeFirst();

	return generateResponse(record);
}

export async function updateRecord(code: IBackupFileRecord['code'], backupFileRecord: IBackupFileRecordUpdate) {
	const record = await db
		.updateTable(TABLE_NAME)
		.set(backupFileRecord)
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record, 404);
}

export async function updateRecordTimeout(code: IBackupFileRecord['code'], time: IBackupFileRecord['last_accessed']) {
	const record = await db
		.updateTable(TABLE_NAME)
		.set({
			last_accessed: time,
		})
		.where('code', '=', code)
		.returningAll()
		.executeTakeFirst();

	return generateResponse(record);
}
