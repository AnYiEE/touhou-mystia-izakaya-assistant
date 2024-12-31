import type {TRatingColorMap} from './types';

export const ratingColors = {
	bad: '#4a4459',
	'bad-border': '#b67596',
	exbad: '#1d0229',
	'exbad-border': '#4d043c',
	exgood: '#fe8081',
	'exgood-border': '#d70404',
	good: '#ff7c47',
	'good-border': '#ffae75',
	norm: '#7b8a5e',
	'norm-border': '#f7ae34',
} as const satisfies TRatingColorMap;
