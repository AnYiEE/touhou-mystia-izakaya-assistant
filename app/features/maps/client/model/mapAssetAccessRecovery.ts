import { refreshAccountState } from '@/features/account/client/session';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export function recoverMapAssetAccessState() {
	void refreshAccountState().catch((error: unknown) => {
		console.warn('Map asset access state refresh failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	});
}
