import { type TSsoActorType } from '@/domain/account/contracts';

export interface IAuditLogWriteInput {
	action: string;
	actorId: string | null;
	actorType: TSsoActorType;
	ipAddress?: string | null;
	metadata?: Record<string, unknown>;
	scope: string;
	targetId: string | null;
	targetType: string;
	userAgent?: string | null;
}
