import {TABLE_NAME_BACKUP_FILE_RECORD as TABLE_NAME, db} from '@/lib';
import type {IBackupFileRecord, IBackupFileRecordNew, IBackupFileRecordUpdate} from '@/lib/types';

type TFileRecord =
	| (IBackupFileRecord & {
			status: 200;
	  })
	| {
			status: 201 | 404 | 429 | 500;
	  };

function generateResponse(record: IBackupFileRecord | undefined, errorStatus = 500) {
	if (record === undefined) {
		return {
			status: errorStatus,
		} as TFileRecord;
	}

	return {
		...record,
		status: 200,
	} as TFileRecord;
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
