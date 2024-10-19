import {useCallback, useEffect, useRef, useState} from 'react';

import {openedPopoverParam} from '@/hooks/useOpenedItemPopover';

import {
	type TClothesNames,
	type TCookerNames,
	type TCurrencyNames,
	type TFoodNames,
	type TOrnamentNames,
	type TPartnerNames,
} from '@/data';

type TItemPaths =
	| 'beverages'
	| 'clothes'
	| 'cookers'
	| 'currencies'
	| 'ingredients'
	| 'ornaments'
	| 'partners'
	| 'recipes';

type TItemNames = TClothesNames | TCookerNames | TCurrencyNames | TFoodNames | TOrnamentNames | TPartnerNames;

export type TOpenWindow = (path: TItemPaths, name: TItemNames) => void;

export const inNewWindowParam = 'preview';

export function useViewInNewWindow() {
	const [windowItemNames, setWindowItemNames] = useState<[TItemNames] | null>(null);
	const [windowItemPath, setWindowItemPath] = useState<[TItemPaths] | null>(null);
	const windowObjectRef = useRef<Window | null>(null);

	useEffect(() => {
		if (windowItemNames === null || windowItemPath === null) {
			return;
		}

		windowObjectRef.current?.close();
		windowObjectRef.current = null;

		const pathname = `/${windowItemPath[0]}?${new URLSearchParams({
			[openedPopoverParam]: windowItemNames[0], // eslint-disable-next-line sort-keys
			[inNewWindowParam]: '1',
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
	}, [windowItemNames, windowItemPath]);

	const openWindow = useCallback<TOpenWindow>((path, name) => {
		setWindowItemNames([name]);
		setWindowItemPath([path]);
	}, []);

	return openWindow;
}
