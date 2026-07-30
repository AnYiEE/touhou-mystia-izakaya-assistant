import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import { CURRENCY_LIST } from '@/domain/data/currencies/records';
import { CUSTOMER_NORMAL_LIST } from '@/domain/data/customers/normal/records';
import { CUSTOMER_RARE_LIST } from '@/domain/data/customers/rare/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { ORNAMENT_LIST } from '@/domain/data/ornaments/records';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import { RECIPE_LIST } from '@/domain/data/recipes/records';

import { createSpriteConfig } from './createSpriteConfig';

export const BEVERAGE_SPRITE_CONFIG = createSpriteConfig(BEVERAGE_LIST.length, {
	height: 26,
	width: 26,
});
export const CLOTHES_SPRITE_CONFIG = createSpriteConfig(CLOTHES_LIST.length, {
	height: 26,
	width: 26,
});
export const COOKER_SPRITE_CONFIG = createSpriteConfig(COOKER_LIST.length, {
	height: 26,
	width: 26,
});
export const CURRENCY_SPRITE_CONFIG = createSpriteConfig(CURRENCY_LIST.length, {
	height: 26,
	width: 26,
});
export const CUSTOMER_NORMAL_SPRITE_CONFIG = createSpriteConfig(
	CUSTOMER_NORMAL_LIST.length,
	{ height: 177, width: 133 }
);
export const CUSTOMER_RARE_SPRITE_CONFIG = createSpriteConfig(
	CUSTOMER_RARE_LIST.length,
	{ height: 184, width: 184 }
);
export const INGREDIENT_SPRITE_CONFIG = createSpriteConfig(
	INGREDIENT_LIST.length,
	{ height: 26, width: 26 }
);
export const ORNAMENT_SPRITE_CONFIG = createSpriteConfig(ORNAMENT_LIST.length, {
	height: 26,
	width: 26,
});
export const PARTNER_SPRITE_CONFIG = createSpriteConfig(PARTNER_LIST.length, {
	height: 184,
	width: 184,
});
export const RECIPE_SPRITE_CONFIG = createSpriteConfig(RECIPE_LIST.length, {
	height: 26,
	width: 26,
});
