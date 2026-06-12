'use client';

import { memo, useEffect } from 'react';

import { type IAccountSsoGrantInitialData } from '@/lib/account/shared/types';
import { accountStore } from '@/stores/account';

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
