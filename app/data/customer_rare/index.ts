import {
	type TEvaluationKey,
	type TEvaluationKeyMap,
	type TEvaluationMap,
	type TRatingKey,
	type TRatingKeyMap,
	type TRatingMap,
} from '@/data';
import { BEVERAGE_TAG_STYLE } from '@/data/beverages';
import { RECIPE_TAG_STYLE } from '@/data/recipes';
import type { ITagStyle } from '@/data/types';
import { generateSpriteConfig } from '@/data/utils';
import { CUSTOMER_RARE_LIST } from './data';

export const CUSTOMER_RARE_SPRITE_CONFIG = generateSpriteConfig(
	CUSTOMER_RARE_LIST.length,
	{ height: 184, width: 184 }
);

export const CUSTOMER_RARE_TAG_STYLE = {
	...RECIPE_TAG_STYLE,
	beverage: BEVERAGE_TAG_STYLE.positive,
} as const satisfies ITagStyle;

export const CUSTOMER_EVALUATION_MAP: TEvaluationMap = {
	exbad: '极度不满', // eslint-disable-next-line sort-keys
	bad: '不满',
	norm: '普通', // eslint-disable-next-line sort-keys
	good: '满意', // eslint-disable-next-line sort-keys
	exgood: '完美',
	lackmoneynormal: '小额超支', // eslint-disable-next-line sort-keys
	lackmoneyangry: '大额超支',
	repell: '被驱赶',
	seenRepell: '评价驱赶行为',
};

export const CUSTOMER_EVALUATION_KEY_MAP = Object.entries(
	CUSTOMER_EVALUATION_MAP
).reduce<Partial<TEvaluationKeyMap>>((acc, [key, value]) => {
	acc[value] = key as TEvaluationKey;
	return acc;
}, {}) as TEvaluationKeyMap;

export const CUSTOMER_RATING_MAP = Object.entries(
	CUSTOMER_EVALUATION_MAP
).reduce<Partial<TEvaluationMap>>((acc, [key, value]) => {
	const ratingKey = key as TEvaluationKey;
	if (
		ratingKey === 'exbad' ||
		ratingKey === 'bad' ||
		ratingKey === 'norm' ||
		ratingKey === 'good' ||
		ratingKey === 'exgood'
	) {
		acc[ratingKey as TRatingKey] = value;
	}
	return acc;
}, {}) as TRatingMap;

export const CUSTOMER_RATING_KEY_MAP = Object.entries(
	CUSTOMER_RATING_MAP
).reduce<Partial<TRatingKeyMap>>((acc, [key, value]) => {
	acc[value] = key as TRatingKey;
	return acc;
}, {}) as TRatingKeyMap;

export const CUSTOMER_EVALUATION = Object.values(CUSTOMER_EVALUATION_MAP);
export const CUSTOMER_EVALUATION_KEY = Object.keys(
	CUSTOMER_EVALUATION_MAP
) as TEvaluationKey[];
export const CUSTOMER_RATING = Object.values(CUSTOMER_RATING_MAP);
export const CUSTOMER_RATING_KEY = Object.keys(
	CUSTOMER_RATING_MAP
) as TRatingKey[];

export * from './data';
