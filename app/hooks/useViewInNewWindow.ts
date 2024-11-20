import {useCallback, useEffect, useRef, useState} from 'react';

import {PARAM_SPECIFY} from '@/hooks/useOpenedItemPopover';

import {
	type TClothesId,
	type TCookerId,
	type TCurrencyId,
	type TFoodId,
	type TOrnamentId,
	type TPartnerId,
} from '@/data';

type TItemPath =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'ingredients'
	| 'ornaments'
	| 'partners'
	| 'recipes';

type TItemId = TClothesId | TCookerId | TCurrencyId | TFoodId | TOrnamentId | TPartnerId;

export type TOpenWindow = (path: TItemPath, id: TItemId) => void;

export const PARAM_PREVIEW = 'preview';

export function useViewInNewWindow() {
	const [windowItemId, setWindowItemId] = useState<[TItemId] | null>(null);
	const [windowItemPath, setWindowItemPath] = useState<[TItemPath] | null>(null);
	const windowObjectRef = useRef<Window | null>(null);

	useEffect(() => {
		if (windowItemId === null || windowItemPath === null) {
			return;
		}

		windowObjectRef.current?.close();
		windowObjectRef.current = null;

		const pathname = `/${windowItemPath[0]}?${new URLSearchParams({
			[PARAM_SPECIFY]: windowItemId[0].toString(), // eslint-disable-next-line sort-keys
			[PARAM_PREVIEW]: '1',
		}).toString()}`;
		const height = 640;
		const width = 384;

		const {height: screenHeight, width: screenWidth} = screen;
		const newWindowObject = globalThis.open(
			pathname,
			'_blank',
			`left=${screenWidth - width},top=${screenHeight - height},height=${height},width=${width}`
		);

		windowObjectRef.current = newWindowObject;
	}, [windowItemId, windowItemPath]);

	const openWindow = useCallback<TOpenWindow>((path, name) => {
		setWindowItemId([name]);
		setWindowItemPath([path]);
	}, []);

	return openWindow;
}
