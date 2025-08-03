import { BEVERAGE_TAG_STYLE } from '@/data/beverages';
import { RECIPE_TAG_STYLE } from '@/data/recipes';
import type { ITagStyle } from '@/data/types';
import type { ISpriteConfig } from '@/utils/sprite/types';

export const CUSTOMER_NORMAL_SPRITE_CONFIG = {
	col: 10,
	row: 5,

	height: 885,
	width: 1330,
} as const satisfies ISpriteConfig;

export const CUSTOMER_NORMAL_TAG_STYLE = {
	beverage: BEVERAGE_TAG_STYLE.positive,
	positive: RECIPE_TAG_STYLE.positive,
} as const satisfies Omit<ITagStyle, 'negative'>;

export * from './data';
