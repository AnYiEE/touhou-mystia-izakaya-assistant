import { useCallback, useEffect, useRef, useState } from 'react';

import { PARAM_SPECIFY } from '@/hooks/useOpenedItemPopover';

import { trackEvent } from '@/components/analytics';

import {
	type TClothesName,
	type TCookerName,
	type TCurrencyName,
	type TFoodName,
	type TOrnamentName,
	type TPartnerName,
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

type TItemName =
	| TClothesName
	| TCookerName
	| TCurrencyName
	| TFoodName
	| TOrnamentName
	| TPartnerName;

export type TOpenWindow = (path: TItemPath, name: TItemName) => void;

export const PARAM_PREVIEW = 'preview';

export function useViewInNewWindow() {
	const [windowItemName, setWindowItemName] = useState<[TItemName] | null>(
		null
	);
	const [windowItemPath, setWindowItemPath] = useState<[TItemPath] | null>(
		null
	);
	const windowObjectRef = useRef<Window | null>(null);

	useEffect(() => {
		if (windowItemName === null || windowItemPath === null) {
			return;
		}

		windowObjectRef.current?.close();
		windowObjectRef.current = null;

		const pathname = `/${windowItemPath[0]}?${new URLSearchParams({
			[PARAM_SPECIFY]: windowItemName[0], // eslint-disable-next-line sort-keys
			[PARAM_PREVIEW]: '1',
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
	}, [windowItemName, windowItemPath]);

	const openWindow = useCallback<TOpenWindow>((path, name) => {
		trackEvent(trackEvent.category.click, 'OpenWindow Button', path, name);
		setWindowItemName([name]);
		setWindowItemPath([path]);
	}, []);

	return openWindow;
}
