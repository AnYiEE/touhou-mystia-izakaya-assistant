export interface ITagStyleConfig {
	backgroundColor: string;
	borderColor: string;
	color: string;
}

export interface ITagStyle {
	beverage?: ITagStyleConfig;
	negative?: ITagStyleConfig;
	positive?: ITagStyleConfig;
}

export const BEVERAGE_TAG_STYLE = {
	positive: {
		backgroundColor: '#b0cfd7',
		borderColor: '#6f929b',
		color: '#a45c22',
	},
} as const satisfies ITagStyle;

export const FOOD_TAG_STYLE = {
	negative: {
		backgroundColor: '#5d453a',
		borderColor: '#000000',
		color: '#e6b4a6', // The contrast of the tag color #e40d0d in the game is too low.
	},
	positive: {
		backgroundColor: '#e6b4a6',
		borderColor: '#9d5437',
		color: '#830000',
	},
} as const satisfies ITagStyle;

export const INGREDIENT_TAG_STYLE = {
	positive: {
		backgroundColor: '#efe0a6',
		borderColor: '#a1904e',
		color: '#90611b',
	},
} as const satisfies ITagStyle;

export const NORMAL_GUEST_TAG_STYLE = {
	beverage: BEVERAGE_TAG_STYLE.positive,
	positive: FOOD_TAG_STYLE.positive,
} as const satisfies Omit<ITagStyle, 'negative'>;

export const SPECIAL_GUEST_TAG_STYLE = {
	...FOOD_TAG_STYLE,
	beverage: BEVERAGE_TAG_STYLE.positive,
} as const satisfies ITagStyle;
