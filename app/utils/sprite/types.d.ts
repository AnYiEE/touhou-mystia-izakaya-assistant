import type {Beverages} from '@/data/beverages';
import type {CustomerNormals} from '@/data/customer_normal';
import type {CustomerRares} from '@/data/customer_rare';
import type {Ingredients} from '@/data/ingredients';
import type {Kitchenwares} from '@/data/kitchenwares';
import type {Recipes} from '@/data/recipes';

type SpriteTarget = 'beverage' | 'customer_normal' | 'customer_rare' | 'ingredient' | 'kitchenware' | 'recipe';

type SpriteData<T extends SpriteTarget> = T extends 'beverage'
	? Beverages
	: T extends 'customer_normal'
		? CustomerNormals
		: T extends 'customer_rare'
			? CustomerRares
			: T extends 'ingredient'
				? Ingredients
				: T extends 'kitchenware'
					? Kitchenwares
					: T extends 'recipe'
						? Recipes
						: never;

interface ISpriteConfig {
	col: number;
	row: number;
	height: number;
	width: number;
}

export type {SpriteData, SpriteTarget, ISpriteConfig};
