import { type Kysely } from 'kysely';

import { getApplicationDatabase } from '@/infrastructure/database/applicationDatabase';
import type { TDatabase } from '@/infrastructure/database/schema';

import { getCompiledSiteStatusBuildOperationId } from './buildIdentity';
import { toDeploymentMaintenancePublicState } from './maintenancePolicy';
import {
	clearDeploymentMaintenance,
	readActiveDeploymentMaintenance,
} from './maintenanceRepository';

export async function resolveDeploymentMaintenanceForDatabase(
	database: Kysely<TDatabase>,
	compiledOperationId: string | null,
	now = Date.now()
) {
	let state = await readActiveDeploymentMaintenance(database, now);
	if (state === null) {
		return null;
	}

	if (state.operationId === compiledOperationId) {
		const cleared = await clearDeploymentMaintenance(
			database,
			state.operationId
		);
		if (cleared) {
			return null;
		}

		state = await readActiveDeploymentMaintenance(database, now);
		if (state === null) {
			return null;
		}
	}

	return toDeploymentMaintenancePublicState(state);
}

export async function readDeploymentMaintenance() {
	const database = await getApplicationDatabase();
	return await resolveDeploymentMaintenanceForDatabase(
		database,
		getCompiledSiteStatusBuildOperationId()
	);
}
