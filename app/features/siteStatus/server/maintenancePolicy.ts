import type { IDeploymentMaintenancePublicState } from '@/features/siteStatus/contracts';

export const DEPLOYMENT_MAINTENANCE_MESSAGE =
	'系统正在维护，期间访问速度可能变慢，部分操作可能需要稍后重试。';

export function toDeploymentMaintenancePublicState({
	expiresAt,
	operationId,
	startedAt,
}: {
	expiresAt: number;
	operationId: string;
	startedAt: number;
}): IDeploymentMaintenancePublicState {
	return {
		expires_at: expiresAt,
		id: operationId,
		level: 'warning',
		message: DEPLOYMENT_MAINTENANCE_MESSAGE,
		started_at: startedAt,
	};
}
