import { type Insertable, type Selectable, type Updateable } from 'kysely';

import { type TUserStatus } from '@/lib/account/shared/types';
import { type TSyncNamespace } from '@/lib/account/sync';

interface ITableBackupFileRecord {
	code: string;
	created_at: number;
	last_accessed: number;
	ip_address: string;
	user_agent: string;
	user_id: string;
}

interface ITableBackupCodeLock {
	code: string;
	expires_at: number;
	owner_id: string;
}

interface ITableBackupImportRecord {
	code: string;
	created_at: number;
	results: string;
	state_epoch: number;
	user_id: string;
}

interface ITableUser {
	created_at: number;
	deleted_at: number | null;
	id: string;
	last_login_at: number | null;
	state_epoch: number;
	status: TUserStatus;
	updated_at: number;
	username: string;
	username_normalized: string;
}

interface ITableUserCredential {
	failed_attempts: number;
	locked_until: number | null;
	password_hash: string;
	password_must_change: number;
	updated_at: number;
	user_id: string;
}

interface ITableSession {
	created_at: number;
	id: string;
	ip_address: string;
	last_seen_at: number;
	token_hash: string;
	user_agent: string;
	user_id: string;
}

interface ITableUserState {
	data: string;
	namespace: TSyncNamespace;
	revision: number;
	schema_version: number;
	updated_at: number;
	user_id: string;
}

export type TBackupFileRecord = Selectable<ITableBackupFileRecord>;
export type TBackupFileRecordNew = Insertable<ITableBackupFileRecord>;
export type TBackupFileRecordUpdate = Updateable<ITableBackupFileRecord>;

export type TBackupCodeLock = Selectable<ITableBackupCodeLock>;
export type TBackupCodeLockNew = Insertable<ITableBackupCodeLock>;
export type TBackupCodeLockUpdate = Updateable<ITableBackupCodeLock>;

export type TBackupImportRecord = Selectable<ITableBackupImportRecord>;
export type TBackupImportRecordNew = Insertable<ITableBackupImportRecord>;
export type TBackupImportRecordUpdate = Updateable<ITableBackupImportRecord>;

export type TUser = Selectable<ITableUser>;
export type TUserNew = Insertable<ITableUser>;
export type TUserUpdate = Updateable<ITableUser>;

export type TUserCredential = Selectable<ITableUserCredential>;
export type TUserCredentialNew = Insertable<ITableUserCredential>;
export type TUserCredentialUpdate = Updateable<ITableUserCredential>;

export type TSession = Selectable<ITableSession>;
export type TSessionNew = Insertable<ITableSession>;
export type TSessionUpdate = Updateable<ITableSession>;

export type TUserState = Selectable<ITableUserState>;
export type TUserStateNew = Insertable<ITableUserState>;
export type TUserStateUpdate = Updateable<ITableUserState>;

export interface TDatabase {
	backup_code_locks: ITableBackupCodeLock;
	backup_files: ITableBackupFileRecord;
	backup_imports: ITableBackupImportRecord;
	sessions: ITableSession;
	users: ITableUser;
	user_credentials: ITableUserCredential;
	user_state: ITableUserState;
}
