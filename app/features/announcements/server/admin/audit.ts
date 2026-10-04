import { type Transaction } from 'kysely';

import type { IAuditLogWriteInput } from '@/features/account/server/audit/contracts';

import type { TDatabase } from '@/infrastructure/database/schema';

export const ANNOUNCEMENT_AUDIT_SCOPE = 'announcement';
export const ANNOUNCEMENT_AUDIT_TARGET_TYPE = 'announcement';

export type TAnnouncementMutationAuditAction =
	| 'admin-archive-announcement'
	| 'admin-create-announcement'
	| 'admin-disable-announcement'
	| 'admin-enable-announcement'
	| 'admin-restore-announcement'
	| 'admin-update-announcement';

export type TWriteAnnouncementAudit = (
	database: Transaction<TDatabase>,
	input: IAuditLogWriteInput,
	now: number
) => Promise<void>;

export interface IAdminAnnouncementMutationContext {
	changedBy: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	writeAuditLog: TWriteAnnouncementAudit;
}

export function createAnnouncementMutationAuditInput({
	action,
	actorId,
	announcementId,
	changedFields,
	ipAddress,
	revision,
	userAgent,
}: {
	action: TAnnouncementMutationAuditAction;
	actorId: string | null;
	announcementId: string;
	changedFields: string[];
	ipAddress?: string | null;
	revision: number;
	userAgent?: string | null;
}): IAuditLogWriteInput {
	const auditInput: IAuditLogWriteInput = {
		action,
		actorId,
		actorType: 'admin',
		metadata: {
			announcement_revision: revision,
			changed_fields: changedFields.join(','),
		},
		scope: ANNOUNCEMENT_AUDIT_SCOPE,
		targetId: announcementId,
		targetType: ANNOUNCEMENT_AUDIT_TARGET_TYPE,
	};
	if (ipAddress !== undefined) {
		auditInput.ipAddress = ipAddress;
	}
	if (userAgent !== undefined) {
		auditInput.userAgent = userAgent;
	}

	return auditInput;
}

export function createAnnouncementUpdateAuditAction(
	previousEnabled: boolean,
	nextEnabled: boolean
): TAnnouncementMutationAuditAction {
	if (!previousEnabled && nextEnabled) {
		return 'admin-enable-announcement';
	}
	if (previousEnabled && !nextEnabled) {
		return 'admin-disable-announcement';
	}

	return 'admin-update-announcement';
}
