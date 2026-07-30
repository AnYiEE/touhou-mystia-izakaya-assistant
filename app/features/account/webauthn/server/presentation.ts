import type { IWebauthnCredentialSummary } from '@/features/account/contracts';

import type { TUserWebauthnCredential } from '@/infrastructure/database/schema';

export function createWebauthnCredentialSummary(
	credential: TUserWebauthnCredential
): IWebauthnCredentialSummary {
	return {
		backed_up: credential.backed_up === 1,
		created_at: credential.created_at,
		device_type: credential.device_type,
		id: credential.id,
		last_used_at: credential.last_used_at,
		name: credential.name,
	};
}
