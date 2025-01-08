import {type Key, useCallback} from 'react';

import {useImmer} from 'use-immer';

import {type PressEvent} from 'react-aria-components';

import {getUniqueID} from '@/design/ui/utils';

export interface IRippleItem {
	key: Key;
	x: number;
	y: number;
	size: number;
}

export function useRipple() {
	const [ripples, setRipples] = useImmer<IRippleItem[]>([]);

	const onClear = useCallback(
		(key: Key) => {
			setRipples((draft) => draft.filter((ripple) => ripple.key !== key));
		},
		[setRipples]
	);

	const onPress = useCallback(
		({target: {clientHeight, clientWidth}, x, y}: PressEvent) => {
			const size = Math.max(clientWidth, clientHeight);

			setRipples((draft) => {
				draft.push({
					key: getUniqueID(),
					size,
					x: x - size / 2,
					y: y - size / 2,
				});
			});
		},
		[setRipples]
	);

	return {
		onClear,
		onPress,
		ripples,
	};
}

export type TUseRippleReturn = ReturnType<typeof useRipple>;
