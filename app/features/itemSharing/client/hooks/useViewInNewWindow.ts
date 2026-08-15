import { useCallback, useEffect, useRef, useState } from 'react';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	ITEM_PREVIEW_PARAM_NAME,
	ITEM_SHARE_PARAM_NAME,
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';

export function useViewInNewWindow() {
	const [windowRecord, setWindowRecord] = useState<[TShareableItemId] | null>(
		null
	);
	const [windowItemPath, setWindowItemPath] = useState<
		[TItemRoutePath] | null
	>(null);
	const windowObjectRef = useRef<Window | null>(null);

	useEffect(() => {
		if (windowRecord === null || windowItemPath === null) {
			return;
		}

		windowObjectRef.current?.close();
		windowObjectRef.current = null;

		const pathname = `/${windowItemPath[0]}?${new URLSearchParams({
			[ITEM_SHARE_PARAM_NAME]: String(windowRecord[0]),
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

		windowObjectRef.current = newWindowObject;
	}, [windowItemPath, windowRecord]);

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
			setWindowRecord([recordId]);
			setWindowItemPath([path]);
		},
		[]
	);

	return openWindow;
}
