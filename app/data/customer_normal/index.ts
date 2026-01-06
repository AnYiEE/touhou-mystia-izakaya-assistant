import { BEVERAGE_TAG_STYLE } from '@/data/beverages';
import { RECIPE_TAG_STYLE } from '@/data/recipes';
import type { ITagStyle } from '@/data/types';
import { generateSpriteConfig } from '@/data/utils';
import { CUSTOMER_NORMAL_LIST } from './data';

export const CUSTOMER_NORMAL_SPRITE_CONFIG = generateSpriteConfig(
	CUSTOMER_NORMAL_LIST.length,
	{ height: 177, width: 133 }
);

export const CUSTOMER_NORMAL_TAG_STYLE = {
	beverage: BEVERAGE_TAG_STYLE.positive,
	positive: RECIPE_TAG_STYLE.positive,
} as const satisfies Omit<ITagStyle, 'negative'>;

export * from './data';
