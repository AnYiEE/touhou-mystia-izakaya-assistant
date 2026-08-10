import { memoize } from '../../../shared/utilities/cache/memoize';
import type { TColorScale } from './types';

export const swapColorScale = memoize(function swapColorScale(
	colors: TColorScale
): TColorScale {
	const keys = Object.keys(colors).map(Number) as Array<keyof TColorScale>;
	const { length } = keys;

	return Object.fromEntries(
		keys.map((key, index) => {
			const mirrorKey = keys[length - 1 - index] as keyof TColorScale;
			return [key, colors[mirrorKey]];
		})
	) as TColorScale;
}, 'WeakMap');
