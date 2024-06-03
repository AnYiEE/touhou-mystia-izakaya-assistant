import {
	BEVERAGE_LIST,
	BEVERAGE_SPRITE_CONFIG,
	CUSTOMER_NORMAL_LIST,
	CUSTOMER_NORMAL_SPRITE_CONFIG,
	INGREDIENT_LIST,
	INGREDIENT_SPRITE_CONFIG,
	KITCHENWARE_LIST,
	KITCHENWARE_SPRITE_CONFIG,
	RECIPE_LIST,
	RECIPE_SPRITE_CONFIG,
} from '@/data';

import {Sprite} from '@/utils';

const beverageSpriteInstance = new Sprite<'beverages'>(BEVERAGE_LIST, BEVERAGE_SPRITE_CONFIG);
const customerNormalSpriteInstance = new Sprite<'customer_normal'>(CUSTOMER_NORMAL_LIST, CUSTOMER_NORMAL_SPRITE_CONFIG);
const ingredientSpriteInstance = new Sprite<'ingredients'>(INGREDIENT_LIST, INGREDIENT_SPRITE_CONFIG);
const kitchenwareSpriteInstance = new Sprite<'kitchenwares'>(KITCHENWARE_LIST, KITCHENWARE_SPRITE_CONFIG);
const recipeSpriteInstance = new Sprite<'recipes'>(RECIPE_LIST, RECIPE_SPRITE_CONFIG);

export {
	beverageSpriteInstance,
	customerNormalSpriteInstance,
	ingredientSpriteInstance,
	kitchenwareSpriteInstance,
	recipeSpriteInstance,
};
