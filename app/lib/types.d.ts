import {type Insertable, type Selectable, type Updateable} from 'kysely';

interface IBackupFileRecordTable {
	code: string;
	file_path: string;
	created_at: number;
	last_accessed: number;
	ip_address: string;
}

export type IBackupFileRecord = Selectable<IBackupFileRecordTable>;
export type IBackupFileRecordNew = Insertable<IBackupFileRecordTable>;
export type IBackupFileRecordUpdate = Updateable<IBackupFileRecordTable>;
export type TBackupFileRecordTableName = 'backup_files';

export type TDatabase = Record<TBackupFileRecordTableName, IBackupFileRecordTable>;
