'use client';

import { useCallback } from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import type { TOverlayId } from '@/features/overlays/contracts';

export function useAccountLoginRequiredAction(parentId?: TOverlayId) {
	return useCallback(() => {
		accountStore.openAccountModalAfterAuthentication(parentId);
	}, [parentId]);
}
