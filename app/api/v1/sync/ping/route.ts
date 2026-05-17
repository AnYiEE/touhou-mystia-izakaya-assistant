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
		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
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

	const results: TSyncStatePutResult[] = [];
	for (const change of parsedBody.changes) {
		const record = createUserStateRecord(
			auth.data.user.id,
			change,
			change.revision + 1,
			Date.now()
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
			parsedBody.state_epoch
		);
		if (result.status === 'state-epoch-mismatch') {
			return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
				state_epoch: result.state_epoch,
			});
		}
		if (result.status === 'conflict') {
			results.push({
				data:
					result.current === null
						? null
						: parseUserStateData(result.current.data),
				namespace: change.namespace,
				revision: result.current?.revision ?? 0,
				status: 'conflict',
				updated_at: result.current?.updated_at ?? 0,
			});
			continue;
		}

		results.push({
			namespace: change.namespace,
			revision: change.revision + 1,
			status: 'ok',
			updated_at: record.updated_at,
		});
	}

	return createNoStoreJsonResponse({
		results,
		state_epoch: auth.data.user.state_epoch,
	});
}
