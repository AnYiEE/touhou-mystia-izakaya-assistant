import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';

import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

export function createSyncClientUpdateRequiredResponse() {
	return createNoStoreErrorResponse(
		ACCOUNT_API_RESPONSE_CODE_MAP.clientUpdateRequired,
		426
	);
}
