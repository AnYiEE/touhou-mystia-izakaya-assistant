import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

import type {
	TFeatureAccessAdminError,
	TFeatureAccessAdminResult,
} from './service';

const FEATURE_ACCESS_ADMIN_ERROR_STATUS_MAP = {
	'feature-access-group-invalid': 400,
	'feature-access-group-name-conflict': 409,
	'feature-access-group-not-found': 404,
	'feature-access-module-invalid': 400,
	'feature-access-user-invalid': 400,
	'feature-access-user-not-found': 404,
} as const satisfies Record<TFeatureAccessAdminError, number>;

export function createFeatureAccessAdminResultResponse<TData>(
	result: TFeatureAccessAdminResult<TData>
) {
	return result.status === 'ok'
		? createNoStoreJsonResponse(result.data)
		: createNoStoreErrorResponse(
				result.error,
				FEATURE_ACCESS_ADMIN_ERROR_STATUS_MAP[result.error]
			);
}
