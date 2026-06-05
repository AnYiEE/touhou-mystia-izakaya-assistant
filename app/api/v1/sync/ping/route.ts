import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
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
	type ISyncStatePingBody,
	type TSyncStatePutResult,
} from '@/lib/account/sync';
import {
	createUserStateRecord,
	parseSyncStatePutBody,
	parseUserStateData,
} from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'sync-ping'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	const body = await readJsonBody<ISyncStatePingBody>(request);
	if (typeof body?.csrf_token !== 'string') {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const parsedBody = parseSyncStatePutBody(body, ['csrf_token']);
	if (parsedBody === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/account/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		const response = createNoStoreErrorResponse(
			auth.message,
			auth.httpStatus
		);
		authModule.clearAccountSessionCookie(response, request);

		return response;
	}
	if (
		!authModule.verifyAccountCsrfToken(
			body.csrf_token,
			auth.data.sessionTokenHash
		)
	) {
		return createNoStoreErrorResponse('forbidden', 403);
	}
	if (parsedBody.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
		});
	}

	const seenNamespaces = new Set<string>();
	for (const change of parsedBody.changes) {
		if (seenNamespaces.has(change.namespace)) {
			return createNoStoreErrorResponse('duplicate-namespace', 400, {
				namespace: change.namespace,
			});
		}
		seenNamespaces.add(change.namespace);
	}

	const results: TSyncStatePutResult[] = [];
	const preparedChanges = parsedBody.changes.map((change) => {
		const nextRevision = change.revision + 1;
		const record = createUserStateRecord(
			auth.data.user.id,
			change,
			nextRevision,
			Date.now()
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

		return { change, record, status: 'ready' as const };
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
		parsedBody.state_epoch
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
			try {
				results.push({
					data:
						result.current === null
							? null
							: parseUserStateData(result.current.data),
					namespace: preparedChange.change.namespace,
					revision: result.current?.revision ?? 0,
					schema_version: result.current?.schema_version ?? 0,
					status: 'conflict',
					updated_at: result.current?.updated_at ?? 0,
				});
			} catch (error) {
				console.warn('Failed to parse conflicting sync state.', error);
				results.push({
					message: 'corrupt-user-state',
					namespace: preparedChange.change.namespace,
					status: 'error',
				});
			}
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
