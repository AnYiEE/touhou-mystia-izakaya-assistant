import { ratingStyles } from './ratingStyles';
import type { TRatingStyleKey } from './types';

export function createRatingVariants<T extends 'base' | 'content'>(key: T) {
	type TColor = Record<TRatingStyleKey, Record<T, string[]>>;

	return {
		variants: {
			color: Object.fromEntries(
				Object.keys(ratingStyles).map((cur) => [
					cur,
					{
						...(key === 'content' ? { base: 'leading-none' } : {}),
						[key]: [
							'leading-none text-background ring-2 dark:text-foreground',
							ratingStyles[cur as TRatingStyleKey],
						],
					} as TColor[TRatingStyleKey],
				])
			) as TColor,
		},
	};
}
