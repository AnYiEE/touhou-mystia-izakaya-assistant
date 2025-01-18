import type {TColorScale} from './types';

import {memoize} from '../../../utilities/memoize';

export const swapColorScale = memoize(function swapColorScale(colors: TColorScale): TColorScale {
	const keys = Object.keys(colors) as unknown as (keyof TColorScale)[];
	const {length} = keys;
	const halfLength = Math.floor(length / 2);

	const swappedColorScale = keys.reduce((result, key, index) => {
		const mirrorIndex = length - 1 - index;

		if (index < halfLength) {
			const mirrorKey = keys[mirrorIndex] as keyof TColorScale;
			result[key] = colors[mirrorKey];
			result[mirrorKey] = colors[key];
		}
		if (index === halfLength && length % 2 !== 0) {
			result[key] = colors[key];
		}

		return result;
	}, {} as TColorScale);

	return swappedColorScale;
});
