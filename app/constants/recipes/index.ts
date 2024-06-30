import type {ITagStyle} from '@/constants/types';

export const RECIPE_TAG_STYLE = {
	negative: {
		backgroundColor: '#5d453a',
		borderColor: '#000000',
		color: '#e6b4a6', // 游戏里的#e40d0d在这里对比度太低
	},
	positive: {
		backgroundColor: '#e6b4a6',
		borderColor: '#9d5437',
		color: '#830000',
	},
} as const satisfies ITagStyle;
