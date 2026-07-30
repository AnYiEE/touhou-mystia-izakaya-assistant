'use client';

import { memo, useEffect } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountWebauthnInitialData } from '@/features/account/contracts';

interface IProps {
	data: IAccountWebauthnInitialData | null;
}

export default memo<IProps>(function AccountWebauthnInitialDataHydrator({
	data,
}) {
	useEffect(() => {
		accountStore.shared.webauthnInitialData.set(data);

		return () => {
			const current = accountStore.shared.webauthnInitialData.get();
			if (current === data) {
				accountStore.shared.webauthnInitialData.set(null);
			}
		};
	}, [data]);

	return null;
});
