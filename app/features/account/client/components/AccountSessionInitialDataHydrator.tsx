'use client';

import { memo, useEffect } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountSessionInitialData } from '@/features/account/contracts';

interface IProps {
	data: IAccountSessionInitialData | null;
}

export default memo<IProps>(function AccountSessionInitialDataHydrator({
	data,
}) {
	useEffect(() => {
		accountStore.shared.sessionInitialData.set(data);

		return () => {
			const current = accountStore.shared.sessionInitialData.get();
			if (current === data) {
				accountStore.shared.sessionInitialData.set(null);
			}
		};
	}, [data]);

	return null;
});
