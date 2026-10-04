import { cleanupAnnouncementRecords } from '@/features/announcements/server/persistence/repository';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

const ANNOUNCEMENT_DISMISSAL_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_KEEP_LATEST = 20;
const ANNOUNCEMENT_RECORD_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastAnnouncementRecordCleanupAt = 0;

function createAnnouncementRecordCleanupOptions(now: number) {
	return {
		dismissalBefore: now - ANNOUNCEMENT_DISMISSAL_RETENTION_MS,
		versionBefore: now - ANNOUNCEMENT_VERSION_RETENTION_MS,
		versionKeepLatest: ANNOUNCEMENT_VERSION_KEEP_LATEST,
	};
}

export async function cleanupAnnouncementRecordsBestEffort(now = Date.now()) {
	if (
		now - lastAnnouncementRecordCleanupAt <
		ANNOUNCEMENT_RECORD_CLEANUP_INTERVAL_MS
	) {
		return;
	}

	lastAnnouncementRecordCleanupAt = now;
	try {
		await cleanupAnnouncementRecords(
			createAnnouncementRecordCleanupOptions(now)
		);
	} catch (error) {
		console.warn('Failed to clean up announcement records.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}
