export const LEGACY_BACKUP_FREQUENCY_TTL = 0;

function createOfflineLegacyBackupError() {
	return new Error('legacy-backup-disabled-offline');
}

export function fetchLegacyBackupMetadata(code: string) {
	void code;
	return Promise.reject(createOfflineLegacyBackupError());
}

export function deleteLegacyBackup(code: string) {
	void code;
	return Promise.reject(createOfflineLegacyBackupError());
}

export function downloadLegacyBackup<T>(code: string): Promise<T> {
	void code;
	return Promise.reject(createOfflineLegacyBackupError());
}

export function uploadLegacyBackup(body: object) {
	void body;
	return Promise.reject(createOfflineLegacyBackupError());
}
