'use client';

import { memo, useEffect } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import { workspaceStore } from '@/features/account/client/workspace/workspaceStore';
import type { IAccountSessionInitialData } from '@/features/account/contracts';

interface IProps {
	data: IAccountSessionInitialData | null;
}

export default memo<IProps>(function AccountSessionInitialDataHydrator({
	data,
}) {
	const owner = workspaceStore.owner.use();
	const phase = workspaceStore.phase.use();

	useEffect(() => {
		const isCurrentAccount =
			data !== null &&
			owner?.kind === 'account' &&
			owner.userId === data.user_id &&
			phase === 'ready';
		accountStore.shared.sessionInitialData.set(
			isCurrentAccount ? data : null
		);

		return () => {
			const current = accountStore.shared.sessionInitialData.get();
			if (current === data || current === null) {
				accountStore.shared.sessionInitialData.set(null);
			}
		};
	}, [data, owner, phase]);

	return null;
});
