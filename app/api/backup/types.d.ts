import type {TBackupFileRecord} from '@/lib/db/types';

export interface IBackupCheckSuccessResponse extends Pick<TBackupFileRecord, 'created_at' | 'last_accessed'> {}

export interface IBackupUploadBody extends Pick<TBackupFileRecord, 'code' | 'user_id'> {
	code: string | null;
	data: {
		customer_normal: object;
		customer_rare: object;
	};
	user_id: string | null;
}

export interface IBackupUploadSuccessResponse extends Pick<TBackupFileRecord, 'code'> {}
