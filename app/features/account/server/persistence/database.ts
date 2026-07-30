import { getAccountFeatureStatus } from '@/features/account/server/featureStatus';

export class AccountFeatureError extends Error {
	readonly reason: string;

	constructor(reason: string) {
		super(reason);
		this.name = 'AccountFeatureError';
		this.reason = reason;
	}
}

export async function getAccountDatabase() {
	const status = await getAccountFeatureStatus();
	if (!status.enabled) {
		throw new AccountFeatureError(status.reason);
	}

	const { getApplicationDatabase } =
		await import('@/infrastructure/database/applicationDatabase');
	return await getApplicationDatabase();
}
