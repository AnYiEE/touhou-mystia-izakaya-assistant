import { type IWebauthnCredentialSummary } from '@/lib/account/shared/types';
import { type TUserWebauthnCredential } from '@/lib/db/types';

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
