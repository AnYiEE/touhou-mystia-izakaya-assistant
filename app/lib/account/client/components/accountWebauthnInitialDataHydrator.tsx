'use client';

import { memo, useEffect } from 'react';

import { type IAccountWebauthnInitialData } from '@/lib/account/shared/types';
import { accountStore } from '@/stores/account';

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
