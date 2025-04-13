import {type Insertable, type Selectable, type Updateable} from 'kysely';

import {type TABLE_NAME_MAP} from './constant';

type TTableNameMap = typeof TABLE_NAME_MAP;

interface ITableBackupFileRecord {
	code: string;
	created_at: number;
	last_accessed: number;
	ip_address: string;
	user_agent: string;
}

export type IBackupFileRecord = Selectable<ITableBackupFileRecord>;
export type IBackupFileRecordNew = Insertable<ITableBackupFileRecord>;
export type IBackupFileRecordUpdate = Updateable<ITableBackupFileRecord>;

export type TDatabase = {
	[key in TTableNameMap['backupFileRecord']]: ITableBackupFileRecord;
};
