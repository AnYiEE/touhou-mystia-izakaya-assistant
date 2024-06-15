import type {ITagStyle} from '@/constants/types';

export const RECIPE_TAG_STYLE = {
	positive: {
		backgroundColor: '#e6b4a6',
		borderColor: '#9d5437',
		color: '#830000',
	},
	negative: {
		backgroundColor: '#5d453a',
		borderColor: '#000000',
		color: '#e40d0d',
	},
} as const satisfies ITagStyle;
