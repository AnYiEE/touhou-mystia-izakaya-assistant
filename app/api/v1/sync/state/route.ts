import { type NextRequest } from 'next/server';

import {
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBody,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	type ISyncStateItemConflict,
	type ISyncStatePutBody,
	type TSyncStatePutResult,
} from '@/lib/account/sync';
import {
	checkSyncNamespace,
	createUserStateRecord,
	parseSyncStatePutBody,
	parseUserStateData,
} from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createConflictResult(
	namespace: ISyncStateItemConflict['namespace'],
	current: Awaited<
		ReturnType<typeof import('@/actions/account/userState').getUserState>
	>
): ISyncStateItemConflict {
	return {
		data: current === null ? null : parseUserStateData(current.data),
		namespace,
		revision: current?.revision ?? 0,
		status: 'conflict',
		updated_at: current?.updated_at ?? 0,
	};
}

export async function GET(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const namespaceParams = request.nextUrl.searchParams.getAll('namespace');
	const namespaces = namespaceParams.filter(checkSyncNamespace);
	if (namespaces.length !== namespaceParams.length) {
		return createNoStoreErrorResponse('unknown-namespace', 400);
	}

	const records = await userStateModule.listUserStateByNamespaces(
		auth.data.user.id,
		namespaces
	);

	return createNoStoreJsonResponse({
		records: records.map((record) => ({
			data: parseUserStateData(record.data),
			namespace: record.namespace,
			revision: record.revision,
			schema_version: record.schema_version,
			updated_at: record.updated_at,
		})),
		state_epoch: auth.data.user.state_epoch,
	});
}

export async function PUT(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'sync-state-put'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}
	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const body = parseSyncStatePutBody(
		await readJsonBody<ISyncStatePutBody>(request)
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (body.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
		});
	}

	const results: TSyncStatePutResult[] = [];
	for (const change of body.changes) {
		const updatedAt = Date.now();
		const nextRevision = change.revision + 1;
		const record = createUserStateRecord(
			auth.data.user.id,
			change,
			nextRevision,
			updatedAt
		);
		if (record === null) {
			results.push({
				message: 'invalid-json-data',
				namespace: change.namespace,
				status: 'error',
			});
			continue;
		}

		const result = await userStateModule.putUserStateEntryIfRevision(
			record,
			change.revision,
			body.state_epoch
		);
		if (result.status === 'state-epoch-mismatch') {
			return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
				state_epoch: result.state_epoch,
			});
		}
		if (result.status === 'conflict') {
			results.push(
				createConflictResult(change.namespace, result.current)
			);
			continue;
		}

		results.push({
			namespace: change.namespace,
			revision: nextRevision,
			status: 'ok',
			updated_at: updatedAt,
		});
	}

	return createNoStoreJsonResponse({
		results,
		state_epoch: auth.data.user.state_epoch,
	});
}
