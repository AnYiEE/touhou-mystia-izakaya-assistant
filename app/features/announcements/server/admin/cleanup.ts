import { type Transaction } from 'kysely';

import type { IAuditLogWriteInput } from '@/features/account/server/audit/contracts';
import { type IAdminAnnouncementCleanupData } from '@/features/announcements/contracts';
import type { TAnnouncementServiceResult } from '@/features/announcements/server/contracts';
import {
	type ICleanupAnnouncementRecordsResult,
	cleanupAnnouncementRecords,
} from '@/features/announcements/server/persistence/repository';

import type { TDatabase } from '@/infrastructure/database/schema';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

const ANNOUNCEMENT_DISMISSAL_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const ANNOUNCEMENT_VERSION_KEEP_LATEST = 20;
const ANNOUNCEMENT_RECORD_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastAnnouncementRecordCleanupAt = 0;

export interface ICleanupAdminAnnouncementRecordsOptions {
	adminId: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

export type TWriteAnnouncementCleanupAudit = (
	database: Transaction<TDatabase>,
	input: IAuditLogWriteInput,
	now: number
) => Promise<void>;

function createAnnouncementRecordCleanupOptions(now: number) {
	return {
		dismissalBefore: now - ANNOUNCEMENT_DISMISSAL_RETENTION_MS,
		versionBefore: now - ANNOUNCEMENT_VERSION_RETENTION_MS,
		versionKeepLatest: ANNOUNCEMENT_VERSION_KEEP_LATEST,
	};
}

function createCleanupAuditInput(
	{ adminId, ipAddress, userAgent }: ICleanupAdminAnnouncementRecordsOptions,
	cleanupResult: ICleanupAnnouncementRecordsResult
) {
	const auditInput: IAuditLogWriteInput = {
		action: 'admin-cleanup-announcement-records',
		actorId: adminId,
		actorType: 'admin',
		metadata: {
			deleted_dismissals: cleanupResult.deletedDismissals,
			deleted_versions: cleanupResult.deletedVersions,
			dismissal_retention_ms: ANNOUNCEMENT_DISMISSAL_RETENTION_MS,
			version_keep_latest: ANNOUNCEMENT_VERSION_KEEP_LATEST,
			version_retention_ms: ANNOUNCEMENT_VERSION_RETENTION_MS,
		},
		scope: 'account',
		targetId: null,
		targetType: 'announcement_records',
	};
	if (ipAddress !== undefined) {
		auditInput.ipAddress = ipAddress;
	}
	if (userAgent !== undefined) {
		auditInput.userAgent = userAgent;
	}

	return auditInput;
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

export async function cleanupAdminAnnouncementRecords(
	options: ICleanupAdminAnnouncementRecordsOptions,
	writeAnnouncementCleanupAudit: TWriteAnnouncementCleanupAudit
): Promise<TAnnouncementServiceResult<IAdminAnnouncementCleanupData>> {
	const now = Date.now();
	const result = await cleanupAnnouncementRecords(
		createAnnouncementRecordCleanupOptions(now),
		(database, auditNow, cleanupResult) =>
			writeAnnouncementCleanupAudit(
				database,
				createCleanupAuditInput(options, cleanupResult),
				auditNow
			)
	);

	return {
		data: {
			deleted_dismissals: result.deletedDismissals,
			deleted_versions: result.deletedVersions,
			message: 'announcement-records-cleaned',
		},
		status: 'ok',
	};
}
