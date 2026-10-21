import { useCallback, useRef } from 'react';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { trackSupportCatalogDetail } from '@/features/donations/client/state/supportNudgeStore';
import {
	ITEM_PREVIEW_PARAM_NAME,
	ITEM_SHARE_PARAM_NAME,
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

export function useViewInNewWindow() {
	const windowObjectRef = useRef<Window | null>(null);

	const openWindow = useCallback(
		(
			path: TItemRoutePath,
			recordId: TShareableItemId,
			name: TShareableItemName
		) => {
			trackEvent(
				trackEvent.category.click,
				'OpenWindow Button',
				path,
				name
			);
			windowObjectRef.current?.close();
			windowObjectRef.current = null;

			const pathname = `/${path}?${new URLSearchParams({
				[ITEM_SHARE_PARAM_NAME]: String(recordId),
				// eslint-disable-next-line sort-keys -- Preserve the existing select-before-preview query serialization.
				[ITEM_PREVIEW_PARAM_NAME]: '1',
			}).toString()}`;
			const height = 640;
			const width = 384;

			const { height: screenHeight, width: screenWidth } = screen;
			const newWindowObject = globalThis.open(
				pathname,
				'_blank',
				`left=${screenWidth - width},top=${screenHeight - height},height=${height},width=${width}`
			);
			if (newWindowObject === null) {
				return;
			}

			newWindowObject.opener = null;
			windowObjectRef.current = newWindowObject;
			trackSupportCatalogDetail(path, recordId);
		},
		[]
	);

	return openWindow;
}
