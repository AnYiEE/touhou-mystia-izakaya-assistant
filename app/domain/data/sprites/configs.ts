import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import { COOKER_LIST } from '@/domain/data/cookers/records';
import { CURRENCY_ITEM_LIST } from '@/domain/data/currencyItems/records';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import { FOOD_LIST } from '@/domain/data/foods/records';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import { PARTNER_LIST } from '@/domain/data/partners/records';

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
export const CURRENCY_ITEM_SPRITE_CONFIG = createSpriteConfig(
	CURRENCY_ITEM_LIST.length,
	{ height: 26, width: 26 }
);
export const DECORATION_SPRITE_CONFIG = createSpriteConfig(
	DECORATION_LIST.length,
	{ height: 26, width: 26 }
);
export const FOOD_SPRITE_CONFIG = createSpriteConfig(FOOD_LIST.length, {
	height: 26,
	width: 26,
});
export const INGREDIENT_SPRITE_CONFIG = createSpriteConfig(
	INGREDIENT_LIST.length,
	{ height: 26, width: 26 }
);
export const NORMAL_GUEST_SPRITE_CONFIG = createSpriteConfig(
	NORMAL_GUEST_LIST.length,
	{ height: 177, width: 133 }
);
export const PARTNER_SPRITE_CONFIG = createSpriteConfig(PARTNER_LIST.length, {
	height: 184,
	width: 184,
});
export const SPECIAL_GUEST_SPRITE_CONFIG = createSpriteConfig(
	SPECIAL_GUEST_LIST.length,
	{ height: 184, width: 184 }
);
