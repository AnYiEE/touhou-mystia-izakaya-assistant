import type {TRatingStyleMap} from './types';

export const ratingStyles = {
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

export type * from './types';
