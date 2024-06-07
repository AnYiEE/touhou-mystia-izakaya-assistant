import type {ITagStyle} from '@/constants/types';

const INGREDIENT_TAG_STYLE = {
	positive: {
		backgroundColor: '#efe0a6',
		borderColor: '#a1904e',
		color: '#90611b',
	},
} as const satisfies ITagStyle;

export {INGREDIENT_TAG_STYLE};
