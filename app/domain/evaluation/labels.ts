import type {
	TEvaluationKey,
	TEvaluationKeyMap,
	TEvaluationMap,
	TRatingKey,
	TRatingKeyMap,
	TRatingMap,
} from './types';

export const GUEST_EVALUATION_MAP: TEvaluationMap = {
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

export const GUEST_EVALUATION_KEY_MAP = Object.fromEntries(
	Object.entries(GUEST_EVALUATION_MAP).map(([key, value]) => [
		value,
		key as TEvaluationKey,
	])
) as TEvaluationKeyMap;

export const GUEST_RATING_MAP = Object.fromEntries(
	Object.entries(GUEST_EVALUATION_MAP).filter(([key]) =>
		['exbad', 'bad', 'norm', 'good', 'exgood'].includes(
			key as TEvaluationKey
		)
	)
) as TRatingMap;

export const GUEST_RATING_KEY_MAP = Object.fromEntries(
	Object.entries(GUEST_RATING_MAP).map(([key, value]) => [
		value,
		key as TRatingKey,
	])
) as TRatingKeyMap;

export const GUEST_EVALUATION = Object.values(GUEST_EVALUATION_MAP);
export const GUEST_EVALUATION_KEY = Object.keys(
	GUEST_EVALUATION_MAP
) as TEvaluationKey[];
export const GUEST_RATING = Object.values(GUEST_RATING_MAP);
export const GUEST_RATING_KEY = Object.keys(GUEST_RATING_MAP) as TRatingKey[];
