import {type Insertable, type Selectable, type Updateable} from 'kysely';

import {type TABLE_NAME_MAP} from './constant';

type TTableNameMap = typeof TABLE_NAME_MAP;

interface ITableBackupFileRecord {
	code: string;
	created_at: number;
	last_accessed: number;
	ip_address: string;
	user_agent: string;
	user_id: string;
}

export type TBackupFileRecord = Selectable<ITableBackupFileRecord>;
export type TBackupFileRecordNew = Insertable<ITableBackupFileRecord>;
export type TBackupFileRecordUpdate = Updateable<ITableBackupFileRecord>;

export type TDatabase = Record<TTableNameMap['backupFileRecord'], ITableBackupFileRecord>;
