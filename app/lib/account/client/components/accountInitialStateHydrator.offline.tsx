'use client';

import { memo } from 'react';

import { type TAccountMeResponse } from '@/lib/account/shared/types';

interface IProps {
	data: TAccountMeResponse;
}

export default memo<IProps>(function AccountInitialStateHydrator() {
	return null;
});
