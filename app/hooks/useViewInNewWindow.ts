import {useCallback, useEffect, useRef, useState} from 'react';

import {openedPopoverParam} from '@/hooks/useOpenedFoodPopover';

import {type TFoodNames} from '@/data';

type TWindowPath = 'beverages' | 'ingredients' | 'recipes';

export type TOpenWindow = (path: TWindowPath, name: TFoodNames) => void;

export const inNewWindowParam = 'preview';

export function useViewInNewWindow() {
	const [windowItemNames, setWindowItemNames] = useState<[TFoodNames] | null>(null);
	const [windowItemPath, setWindowItemPath] = useState<[TWindowPath] | null>(null);
	const windowObjectRef = useRef<Window | null>(null);

	useEffect(() => {
		if (!windowItemNames || !windowItemPath) {
			return;
		}

		windowObjectRef.current?.close();
		windowObjectRef.current = null;

		const pathname = `/${windowItemPath[0]}/?${new URLSearchParams({
			[openedPopoverParam]: windowItemNames[0], // eslint-disable-next-line sort-keys
			[inNewWindowParam]: '1',
		}).toString()}`;
		const height = 480;
		const width = 384;

		const newWindowObject = window.open(
			pathname,
			'_blank',
			`left=${window.screen.width - width},top=${window.screen.height - height},height=${height},width=${width}`
		);

		windowObjectRef.current = newWindowObject;
	}, [windowItemNames, windowItemPath]);

	const openWindow = useCallback<TOpenWindow>((path, name) => {
		setWindowItemNames([name]);
		setWindowItemPath([path]);
	}, []);

	return openWindow;
}
