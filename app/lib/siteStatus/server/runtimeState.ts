import { type Kysely, sql } from 'kysely';

import { DEPLOYMENT_MAINTENANCE_KEY } from '../shared/constants';
import { TABLE_NAME_MAP } from '@/lib/db/constant';
import { type TDatabase } from '@/lib/db/types';
import { getTableColumns } from '@/lib/db/utils';

export interface IDeploymentMaintenanceState {
	expiresAt: number;
	operationId: string;
	startedAt: number;
}

interface IPragmaTableInfoRow {
	name: string;
	notnull: number;
	pk: number;
}

const REQUIRED_COLUMNS = [
	'key',
	'operation_id',
	'started_at',
	'expires_at',
] as const;
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function migrateSiteRuntimeStateTable(
	database: Kysely<TDatabase>
) {
	await database.schema
		.createTable(TABLE_NAME_MAP.siteRuntimeState)
		.ifNotExists()
		.addColumn('key', 'text', (column) => column.primaryKey())
		.addColumn('operation_id', 'text', (column) => column.notNull())
		.addColumn('started_at', 'integer', (column) => column.notNull())
		.addColumn('expires_at', 'integer', (column) => column.notNull())
		.execute();

	const columns = await getTableColumns(
		database,
		TABLE_NAME_MAP.siteRuntimeState
	);
	const missingColumns = REQUIRED_COLUMNS.filter(
		(column) => !columns.includes(column)
	);
	if (missingColumns.length > 0) {
		throw new Error('server-misconfigured: site-runtime-state-columns');
	}

	const { rows } = await sql<IPragmaTableInfoRow>`
		select name, "notnull", pk
		from pragma_table_info(${TABLE_NAME_MAP.siteRuntimeState})
	`.execute(database);
	const keyColumn = rows.find((row) => row.name === 'key');
	const requiredValueColumns = rows.filter((row) =>
		(['operation_id', 'started_at', 'expires_at'] as const).includes(
			row.name as 'expires_at' | 'operation_id' | 'started_at'
		)
	);
	if (
		keyColumn?.pk !== 1 ||
		requiredValueColumns.length !== 3 ||
		requiredValueColumns.some((row) => row.notnull !== 1)
	) {
		throw new Error('server-misconfigured: site-runtime-state-structure');
	}
}

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
