import {type Insertable, type Selectable, type Updateable} from 'kysely';

import {TABLE_NAME_BACKUP_FILE_RECORD} from './db';

type TTableNameBackupFileRecord = typeof TABLE_NAME_BACKUP_FILE_RECORD;
interface ITableBackupFileRecord {
	code: string;
	created_at: number;
	last_accessed: number;
	ip_address: string;
}

export type IBackupFileRecord = Selectable<ITableBackupFileRecord>;
export type IBackupFileRecordNew = Insertable<ITableBackupFileRecord>;
export type IBackupFileRecordUpdate = Updateable<ITableBackupFileRecord>;

export type TDatabase = Record<TTableNameBackupFileRecord, ITableBackupFileRecord>;
