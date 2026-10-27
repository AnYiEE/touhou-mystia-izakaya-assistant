import { type NextRequest } from 'next/server';

import type { TAccountMeResponse } from '@/features/account/contracts';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { readContentLocale } from '@/features/preferences/server/requestLocale';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'account-me',
		'',
		{ noTrustedIpGate: true }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}
	const locale = readContentLocale(request);

	const [
		authModule,
		csrfModule,
		featureAccessModule,
		userModule,
		userStateModule,
	] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/csrf'),
		import('@/features/featureAccess/server/presentation'),
		import('@/features/account/server/presentation/user'),
		import('@/features/account/sync/server'),
	]);
	const auth = await authModule.authenticateAccountFromRequestWithTransaction(
		request,
		async (trx, account) => {
			const [featureAccess, stateSnapshot] = await Promise.all([
				featureAccessModule.presentUserFeatureAccessInTransaction(
					trx,
					account.user.id,
					locale
				),
				userStateModule.getUserStateSnapshotInTransaction(trx, {
					credential: account.credential,
					namespaces: null,
					user: account.user,
				}),
			]);
			return { featureAccess, stateSnapshot };
		},
		true
	);
	if (auth.status === 'error') {
		if (auth.message === 'unauthorized') {
			return createNoStoreJsonResponse({
				csrf_token: null,
				feature_access:
					await featureAccessModule.presentAnonymousFeatureAccess(
						locale
					),
				featureEnabled: true,
				has_password: false,
				isLoggedIn: false,
				password_must_change: false,
				state_epoch: null,
				syncMeta: null,
				user: null,
			} satisfies TAccountMeResponse);
		}

		return createNoStoreErrorResponse(auth.message, auth.httpStatus);
	}

	const { featureAccess, stateSnapshot } = auth.result;
	const revisions = stateSnapshot.records.reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace.namespace] = namespace.revision;
			return result;
		},
		{}
	);

	return createNoStoreJsonResponse({
		csrf_token: csrfModule.createCsrfToken(auth.data.sessionTokenHash),
		feature_access: featureAccess,
		featureEnabled: true,
		has_password: stateSnapshot.credential.password_set === 1,
		isLoggedIn: true,
		password_must_change:
			stateSnapshot.credential.password_must_change === 1,
		state_epoch: stateSnapshot.user.state_epoch,
		syncMeta: {
			lastAppliedRemoteHash: {},
			revisions,
			state_epoch: stateSnapshot.user.state_epoch,
			sync_generation: stateSnapshot.user.sync_generation,
			sync_status: stateSnapshot.user.sync_status,
		},
		user: userModule.createAccountUserProfile(stateSnapshot.user),
	} satisfies TAccountMeResponse);
}
