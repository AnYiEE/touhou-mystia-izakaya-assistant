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

export const CUSTOMER_EVALUATION_KEY_MAP = Object.fromEntries(
	Object.entries(CUSTOMER_EVALUATION_MAP).map(([key, value]) => [
		value,
		key as TEvaluationKey,
	])
) as TEvaluationKeyMap;

export const CUSTOMER_RATING_MAP = Object.fromEntries(
	Object.entries(CUSTOMER_EVALUATION_MAP).filter(([key]) =>
		['exbad', 'bad', 'norm', 'good', 'exgood'].includes(
			key as TEvaluationKey
		)
	)
) as TRatingMap;

export const CUSTOMER_RATING_KEY_MAP = Object.fromEntries(
	Object.entries(CUSTOMER_RATING_MAP).map(([key, value]) => [
		value,
		key as TRatingKey,
	])
) as TRatingKeyMap;

export const CUSTOMER_EVALUATION = Object.values(CUSTOMER_EVALUATION_MAP);
export const CUSTOMER_EVALUATION_KEY = Object.keys(
	CUSTOMER_EVALUATION_MAP
) as TEvaluationKey[];
export const CUSTOMER_RATING = Object.values(CUSTOMER_RATING_MAP);
export const CUSTOMER_RATING_KEY = Object.keys(
	CUSTOMER_RATING_MAP
) as TRatingKey[];
