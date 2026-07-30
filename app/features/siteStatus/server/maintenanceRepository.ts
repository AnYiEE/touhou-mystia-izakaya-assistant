import { type Kysely } from 'kysely';

import type { TDatabase } from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

export const DEPLOYMENT_MAINTENANCE_KEY = 'deployment_maintenance';

export interface IDeploymentMaintenanceState {
	expiresAt: number;
	operationId: string;
	startedAt: number;
}

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function upsertDeploymentMaintenance(
	database: Kysely<TDatabase>,
	state: IDeploymentMaintenanceState
) {
	await database
		.insertInto(TABLE_NAME_MAP.siteRuntimeState)
		.values({
			expires_at: state.expiresAt,
			key: DEPLOYMENT_MAINTENANCE_KEY,
			operation_id: state.operationId,
			started_at: state.startedAt,
		})
		.onConflict((conflict) =>
			conflict
				.column('key')
				.doUpdateSet({
					expires_at: state.expiresAt,
					operation_id: state.operationId,
					started_at: state.startedAt,
				})
		)
		.execute();
}

export async function readActiveDeploymentMaintenance(
	database: Kysely<TDatabase>,
	now = Date.now()
): Promise<IDeploymentMaintenanceState | null> {
	const state = await database
		.selectFrom(TABLE_NAME_MAP.siteRuntimeState)
		.select(['expires_at', 'operation_id', 'started_at'])
		.where('key', '=', DEPLOYMENT_MAINTENANCE_KEY)
		.executeTakeFirst();

	if (
		state === undefined ||
		!UUID_PATTERN.test(state.operation_id) ||
		!Number.isSafeInteger(state.started_at) ||
		!Number.isSafeInteger(state.expires_at) ||
		state.started_at < 0 ||
		state.expires_at <= state.started_at ||
		state.expires_at <= now
	) {
		return null;
	}

	return {
		expiresAt: state.expires_at,
		operationId: state.operation_id,
		startedAt: state.started_at,
	};
}

export async function clearDeploymentMaintenance(
	database: Kysely<TDatabase>,
	operationId: string
) {
	const result = await database
		.deleteFrom(TABLE_NAME_MAP.siteRuntimeState)
		.where('key', '=', DEPLOYMENT_MAINTENANCE_KEY)
		.where('operation_id', '=', operationId)
		.executeTakeFirst();

	return result.numDeletedRows > 0n;
}
