import { type NextRequest } from 'next/server';

import type { IAdminFeatureModulePolicyUpdateBody } from '@/features/featureAccess/contracts';
import {
	checkAdminFeatureAccessLevel,
	checkAdminFeatureModuleKey,
	listAdminFeatureModules,
	updateAdminFeatureModulePolicy,
} from '@/features/featureAccess/admin/server/service';
import { createFeatureAccessAdminResultResponse } from '@/features/featureAccess/admin/server/http';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const guard = await checkAdminRequest(request, 'admin-feature-modules');
	if (guard.status === 'error') {
		return guard.response;
	}

	return createNoStoreJsonResponse(await listAdminFeatureModules());
}

export async function PATCH(request: NextRequest) {
	const guard = await checkAdminRequest(
		request,
		'admin-feature-module-policy',
		{ csrf: true }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	const bodyResult = await readJsonBodyResult<
		Partial<IAdminFeatureModulePolicyUpdateBody>
	>(request, MAX_ACCOUNT_JSON_BODY_BYTES);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (
		body === null ||
		!checkAdminFeatureModuleKey(body.module_key) ||
		!checkAdminFeatureAccessLevel(body.access_level)
	) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	return createFeatureAccessAdminResultResponse(
		await updateAdminFeatureModulePolicy({
			adminId: guard.auth.actorId,
			body: {
				access_level: body.access_level,
				module_key: body.module_key,
			},
			request,
		})
	);
}
