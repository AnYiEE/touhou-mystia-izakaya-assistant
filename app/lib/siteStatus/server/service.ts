import { type Kysely } from 'kysely';

import { getCompiledSiteStatusBuildOperationId } from './buildIdentity';
import {
	clearDeploymentMaintenance,
	migrateSiteRuntimeStateTable,
	readActiveDeploymentMaintenance,
} from './runtimeState';
import { DEPLOYMENT_MAINTENANCE_MESSAGE } from '../shared/constants';
import { type IDeploymentMaintenancePublicState } from '../shared/types';
import { type TDatabase } from '@/lib/db/types';

let databasePromise: Promise<Kysely<TDatabase>> | null = null;

async function loadSiteStatusDatabase() {
	const { db } = await import('@/lib/db/db');
	await migrateSiteRuntimeStateTable(db);
	return db;
}

async function getSiteStatusDatabase() {
	databasePromise ??= loadSiteStatusDatabase();
	try {
		return await databasePromise;
	} catch (error) {
		databasePromise = null;
		throw error;
	}
}

function toPublicState({
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

	return toPublicState(state);
}

export async function readDeploymentMaintenance() {
	const database = await getSiteStatusDatabase();
	return await resolveDeploymentMaintenanceForDatabase(
		database,
		getCompiledSiteStatusBuildOperationId()
	);
}
