import {type ComponentProps, type ElementRef, forwardRef, memo} from 'react';

import {Avatar as NextUIAvatar, extendVariants} from '@nextui-org/react';

import type {TRatingKey} from '@/data';

type TRatingStyleKey = TRatingKey | `${TRatingKey}-border`;

export type TRatingStyleMap = Partial<Record<TRatingStyleKey, string>>;

export function generateRatingColor<T extends 'base' | 'content'>(key: T, colorMap: TRatingStyleMap) {
	type TColor = Record<TRatingStyleKey, Record<T, string[]>>;

	return {
		variants: {
			color: Object.keys(colorMap).reduce<Partial<TColor>>((acc, cur) => {
				acc[cur as TRatingKey] = {
					...(key === 'content'
						? {
								base: 'leading-none',
							}
						: {}),
					[key]: [
						'leading-none text-background ring-2 dark:text-foreground',
						colorMap[cur as TRatingStyleKey],
					],
				} as TColor[TRatingKey];
				return acc;
			}, {}),
		},
	};
}

const ratingStyleMap = {
	bad: 'ring-bad-border bg-bad',
	'bad-border': 'ring-bad-border',
	exbad: 'ring-exbad-border bg-exbad',
	'exbad-border': 'ring-exbad dark:ring-exbad-border',
	exgood: 'ring-exgood-border bg-exgood',
	'exgood-border': 'ring-exgood',
	good: 'ring-good-border bg-good',
	'good-border': 'ring-good',
	norm: 'ring-norm-border bg-norm',
	'norm-border': 'ring-norm',
} as const satisfies TRatingStyleMap;

const CustomNextUIAvatar = extendVariants(NextUIAvatar, generateRatingColor('base', ratingStyleMap));

interface IProps extends ComponentProps<typeof CustomNextUIAvatar> {}

export default memo(
	forwardRef<ElementRef<typeof CustomNextUIAvatar>, IProps>(function Avatar(props, ref) {
		return <CustomNextUIAvatar {...props} ref={ref} />;
	})
);
