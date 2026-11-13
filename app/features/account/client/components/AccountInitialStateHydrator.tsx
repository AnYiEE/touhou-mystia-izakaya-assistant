'use client';

import { memo, useEffect } from 'react';

import { refreshAccountState } from '@/features/account/client/session';
import { initializeAccountWorkspaceFromInitialData } from '@/features/account/client/workspace/lifecycle';
import type { TAccountMeResponse } from '@/features/account/contracts';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

interface IProps {
	data: TAccountMeResponse | null;
}

export default memo<IProps>(function AccountInitialStateHydrator({ data }) {
	useEffect(() => {
		void initializeAccountWorkspaceFromInitialData(data).then(
			(result) => {
				if (result === 'unsupported') {
					return;
				}
				void refreshAccountState().catch((error: unknown) => {
					console.warn('Post-hydration account refresh failed.', {
						errorCode: getLogSafeErrorCode(error),
					});
				});
			},
			(error: unknown) => {
				console.warn(
					'Initial account workspace reconciliation failed.',
					{ errorCode: getLogSafeErrorCode(error) }
				);
			}
		);
	}, [data]);

	return null;
});
