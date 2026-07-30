'use client';

import { memo } from 'react';

import type { TAccountMeResponse } from '@/features/account/contracts';

interface IProps {
	data: TAccountMeResponse | null;
}

export default memo<IProps>(function AccountInitialStateHydrator() {
	return null;
});
