import { type NextRequest } from 'next/server';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { getAccountSyncCapacityConfiguration } from '@/features/account/sync/server/capacity';
import {
	createUserStateRecord,
	parseUserStateRecord,
} from '@/features/account/sync/server/state';
import type { ISyncStateRebuildBody } from '@/features/account/sync/types';
import {
	checkSyncStateRebuildChanges,
	findUnsupportedSyncSchemaVersion,
	parseSyncStatePutBody,
} from '@/features/account/sync/validation';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYNC_REBUILD_CONFLICT_STATUSES = [
	'cloud-not-empty',
	'lock-lost',
	'sync-not-paused',
] as const;

type TSyncRebuildConflictStatus =
	(typeof SYNC_REBUILD_CONFLICT_STATUSES)[number];

function checkSyncRebuildConflictStatus(
	status: string
): status is TSyncRebuildConflictStatus {
	return SYNC_REBUILD_CONFLICT_STATUSES.includes(
		status as TSyncRebuildConflictStatus
	);
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}
	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}
	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}
	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'sync-rebuild'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}
	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'sync-rebuild'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}
	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const capacityConfiguration = getAccountSyncCapacityConfiguration();
	const bodyResult = await readJsonBodyResult<ISyncStateRebuildBody>(
		request,
		capacityConfiguration.requestMaxBytes
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('sync-request-too-large', 413, {
			limit_bytes: capacityConfiguration.requestMaxBytes,
		});
	}
	const rawBody = bodyResult.status === 'ok' ? bodyResult.data : null;
	const body = parseSyncStatePutBody(rawBody);
	if (body === null || !checkSyncStateRebuildChanges(body.changes)) {
		const unsupportedSchema = findUnsupportedSyncSchemaVersion(rawBody);
		if (unsupportedSchema !== null) {
			return createNoStoreErrorResponse(
				'sync-schema-update-required',
				409,
				unsupportedSchema
			);
		}
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (auth.data.user.sync_status !== ACCOUNT_SYNC_STATUS_MAP.pausedEmpty) {
		return createNoStoreErrorResponse('sync-not-paused', 409, {
			state_epoch: auth.data.user.state_epoch,
			sync_generation: auth.data.user.sync_generation,
			sync_status: auth.data.user.sync_status,
		});
	}

	const updatedAt = Date.now();
	const entries = body.changes.map((change) =>
		createUserStateRecord(auth.data.user.id, change, 1, updatedAt)
	);
	if (entries.includes(null)) {
		return createNoStoreErrorResponse('internal-write-error', 500);
	}
	const [userStateModule, accountAuditModule] = await Promise.all([
		import('@/features/account/sync/server/repository'),
		import('@/features/account/server/audit/service'),
	]);
	const result = await userStateModule.rebuildUserStateIfPausedWithAudit(
		entries.filter((entry) => entry !== null),
		body.state_epoch,
		body.sync_generation,
		auth.data.session,
		auth.data.user.id,
		(trx, now, stateEpoch, syncGeneration, totalBytes) =>
			accountAuditModule.writeAccountAuditLogInTransaction(
				trx,
				accountAuditModule.createAccountUserAuditLogInput({
					action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
						.accountSyncRebuilt,
					metadata: {
						namespace_count: entries.length,
						state_epoch: stateEpoch,
						sync_generation: syncGeneration,
						total_bytes: totalBytes,
					},
					request,
					userId: auth.data.user.id,
				}),
				now
			)
	);
	if (result.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (result.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: result.state_epoch,
			sync_generation: result.sync_generation,
			sync_status: result.sync_status,
		});
	}
	if (result.status === 'sync-generation-mismatch') {
		return createNoStoreErrorResponse('sync-generation-mismatch', 409, {
			state_epoch: result.state_epoch,
			sync_generation: result.sync_generation,
			sync_status: result.sync_status,
		});
	}
	if (result.status === 'ok') {
		return createNoStoreJsonResponse({
			records: result.entries.map((entry) => parseUserStateRecord(entry)),
			state_epoch: result.state_epoch,
			sync_generation: result.sync_generation,
			sync_status: result.sync_status,
		});
	}
	if (result.status === 'sync-not-paused') {
		return createNoStoreErrorResponse('sync-rebuild-conflict', 409, {
			state_epoch: result.state_epoch,
			sync_generation: result.sync_generation,
			sync_status: result.sync_status,
		});
	}
	if (checkSyncRebuildConflictStatus(result.status)) {
		return createNoStoreErrorResponse('sync-rebuild-conflict', 409);
	}
	if (result.status === 'capacity-exceeded') {
		return createNoStoreErrorResponse(
			'sync-account-capacity-exceeded',
			409,
			{
				candidate_bytes: result.candidate_bytes,
				limit_bytes: result.limit_bytes,
			}
		);
	}

	return createNoStoreErrorResponse('corrupt-user-state', 500);
}
