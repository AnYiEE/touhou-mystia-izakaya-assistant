'use client';

import { memo, useEffect } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import type { IAccountSsoGrantInitialData } from '@/features/account/contracts';

interface IProps {
	data: IAccountSsoGrantInitialData | null;
}

export default memo<IProps>(function AccountSsoGrantInitialDataHydrator({
	data,
}) {
	useEffect(() => {
		accountStore.shared.ssoGrantInitialData.set(data);

		return () => {
			const current = accountStore.shared.ssoGrantInitialData.get();
			if (current === data) {
				accountStore.shared.ssoGrantInitialData.set(null);
			}
		};
	}, [data]);

	return null;
});
