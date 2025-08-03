import {
	type TRatingStyleKey,
	ratingStyles,
} from '@/design/theme/styles/rating';

export function generateRatingVariants<T extends 'base' | 'content'>(key: T) {
	type TColor = Record<TRatingStyleKey, Record<T, string[]>>;

	return {
		variants: {
			color: Object.keys(ratingStyles).reduce<Partial<TColor>>(
				(acc, cur) => {
					acc[cur as TRatingStyleKey] = {
						...(key === 'content' ? { base: 'leading-none' } : {}),
						[key]: [
							'leading-none text-background ring-2 dark:text-foreground',
							ratingStyles[cur as TRatingStyleKey],
						],
					} as TColor[TRatingStyleKey];
					return acc;
				},
				{}
			),
		},
	};
}
