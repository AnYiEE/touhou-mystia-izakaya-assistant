import {
	BEVERAGE_LIST,
	BEVERAGE_SPRITE_CONFIG,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG,
	INGREDIENT_LIST,
	INGREDIENT_SPRITE_CONFIG,
	KITCHENWARE_LIST,
	KITCHENWARE_SPRITE_CONFIG,
	RECIPES_LIST,
	RECIPES_SPRITE_CONFIG,
} from '@/data';

import {Sprite} from '@/utils';

const beverageSpriteInstance = new Sprite<'beverages'>(BEVERAGE_LIST, BEVERAGE_SPRITE_CONFIG);
const customerNormalInstance = new Sprite<'customer_normal'>(CUSTOMER_NORMAL_LIST, CUSTOMER_NORMAL_SPRITE_CONFIG);
const ingredientSpriteInstance = new Sprite<'ingredients'>(INGREDIENT_LIST, INGREDIENT_SPRITE_CONFIG);
const kitchenwareSpriteInstance = new Sprite<'kitchenwares'>(KITCHENWARE_LIST, KITCHENWARE_SPRITE_CONFIG);
const recipesSpriteInstance = new Sprite<'recipes'>(RECIPES_LIST, RECIPES_SPRITE_CONFIG);

export {
	beverageSpriteInstance,
	customerNormalInstance,
	ingredientSpriteInstance,
	kitchenwareSpriteInstance,
	recipesSpriteInstance,
};
