import type {
	TEvaluationKey,
	TEvaluationKeyMap,
	TEvaluationMap,
	TRatingKey,
	TRatingKeyMap,
	TRatingMap,
} from './types';

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
	if (['exbad', 'bad', 'norm', 'good', 'exgood'].includes(ratingKey)) {
		acc[ratingKey] = value;
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
