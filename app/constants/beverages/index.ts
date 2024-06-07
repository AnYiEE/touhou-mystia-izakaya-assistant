import type {ITagStyle} from '@/constants/types';

const BEVERAGE_TAG_STYLE = {
	positive: {
		backgroundColor: '#b0cfd7',
		borderColor: '#6f929b',
		color: '#a45c22',
	},
} as const satisfies ITagStyle;

export {BEVERAGE_TAG_STYLE};
