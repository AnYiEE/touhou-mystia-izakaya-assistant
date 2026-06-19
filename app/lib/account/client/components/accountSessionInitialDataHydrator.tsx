'use client';

import { memo, useEffect } from 'react';

import { type IAccountSessionInitialData } from '@/lib/account/shared/types';
import { accountStore } from '@/stores/account';

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
