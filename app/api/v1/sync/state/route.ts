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
	const preparedChanges = body.changes.map((change) => {
		const updatedAt = Date.now();
		const nextRevision = change.revision + 1;
		const record = createUserStateRecord(
			auth.data.user.id,
			change,
			nextRevision,
			updatedAt
		);
		if (record === null) {
			return {
				result: {
					message: 'invalid-json-data',
					namespace: change.namespace,
					status: 'error',
				} satisfies TSyncStatePutResult,
				status: 'error' as const,
			};
		}

		return {
			change,
			nextRevision,
			record,
			status: 'ready' as const,
			updatedAt,
		};
	});
	const readyChanges = preparedChanges.filter(
		(
			change
		): change is Extract<
			(typeof preparedChanges)[number],
			{ status: 'ready' }
		> => change.status === 'ready'
	);
	const writeResult = await userStateModule.putUserStateEntriesIfRevision(
		readyChanges.map((change) => ({
			entry: change.record,
			expectedRevision: change.change.revision,
		})),
		body.state_epoch
	);
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
		});
	}

	let writeResultIndex = 0;
	for (const preparedChange of preparedChanges) {
		if (preparedChange.status === 'error') {
			results.push(preparedChange.result);
			continue;
		}

		const result = writeResult.results[writeResultIndex++];
		if (result === undefined) {
			results.push({
				message: 'invalid-json-data',
				namespace: preparedChange.change.namespace,
				status: 'error',
			});
			continue;
		}
		if (result.status === 'conflict') {
			results.push(
				createConflictResult(
					preparedChange.change.namespace,
					result.current
				)
			);
			continue;
		}

		results.push({
			namespace: preparedChange.change.namespace,
			revision: result.entry.revision,
			status: 'ok',
			updated_at: result.entry.updated_at,
		});
	}

	return createNoStoreJsonResponse({
		results,
		state_epoch: auth.data.user.state_epoch,
	});
}
