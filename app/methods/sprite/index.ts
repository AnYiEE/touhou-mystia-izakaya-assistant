import {
	BEVERAGE_LIST,
	BEVERAGE_SPRITE_CONFIG,
	COOKER_LIST,
	COOKER_SPRITE_CONFIG,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG,
	CUSTOMER_RARE_LIST,
	CUSTOMER_RARE_SPRITE_CONFIG,
	CUSTOMER_SPECIAL_LIST,
	CUSTOMER_SPECIAL_SPRITE_CONFIG,
	INGREDIENT_LIST,
	INGREDIENT_SPRITE_CONFIG,
	RECIPE_LIST,
	RECIPE_SPRITE_CONFIG,
} from '@/data';
import {Sprite} from '@/utils';

export const beverageSpriteInstance = new Sprite<'beverage'>(BEVERAGE_LIST, BEVERAGE_SPRITE_CONFIG);
export const cookerSpriteInstance = new Sprite<'cooker'>(COOKER_LIST, COOKER_SPRITE_CONFIG);
export const customerNormalSpriteInstance = new Sprite<'customer_normal'>(
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG
);
export const customerRareSpriteInstance = new Sprite<'customer_rare'>(CUSTOMER_RARE_LIST, CUSTOMER_RARE_SPRITE_CONFIG);
export const customerSpecialSpriteInstance = new Sprite<'customer_special'>(
	CUSTOMER_SPECIAL_LIST,
	CUSTOMER_SPECIAL_SPRITE_CONFIG
);
export const ingredientSpriteInstance = new Sprite<'ingredient'>(INGREDIENT_LIST, INGREDIENT_SPRITE_CONFIG);
export const recipeSpriteInstance = new Sprite<'recipe'>(RECIPE_LIST, RECIPE_SPRITE_CONFIG);

export const spriteInstances = {
	beverage: beverageSpriteInstance,
	cooker: cookerSpriteInstance,
	customer_normal: customerNormalSpriteInstance,
	customer_rare: customerRareSpriteInstance,
	customer_special: customerSpecialSpriteInstance,
	ingredient: ingredientSpriteInstance,
	recipe: recipeSpriteInstance,
} as const;
