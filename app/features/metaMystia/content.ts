import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TClothesId } from '@/domain/data/clothes/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TSpriteId } from '@/domain/data/sprites/types';

/** Records added by the MetaMystia example ResourceEx pack are tagged with DLC 9 in the game data. */
const META_MYSTIA_DLC = 9;

const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const beverageCatalog = BeverageCatalog.getInstance();
const clothesCatalog = ClothesCatalog.getInstance();

/** Display order: Shinki stands in the center with Yuki and Mai, her Makai companions, on her right. */
export const META_MYSTIA_GUEST_IDS = [
	9000, 9001, 9002, 9003, 9004, 11000, 11001, 10000, 10001, 10002,
] as const satisfies ReadonlyArray<TSpecialGuestId>;

export const META_MYSTIA_GUESTS = META_MYSTIA_GUEST_IDS.map((id) => ({
	id,
	name: specialGuestCatalog.getPropsById(id, 'name'),
}));

/**
 * @description Display names follow the catalogue localization runtime, so
 * they are resolved at render time instead of being captured together with
 * the module constants. Canonical names stay reserved for identity and
 * metadata.
 */
export function getMetaMystiaGuestDisplayName(id: TSpecialGuestId) {
	return specialGuestCatalog.getDisplayPropsById(id, 'name');
}

export type TMetaMystiaShowcaseTarget =
	'beverage' | 'clothes' | 'food' | 'ingredient';

export interface IMetaMystiaShowcaseRecord<
	T extends TMetaMystiaShowcaseTarget,
> {
	id: TSpriteId<T>;
}

export interface IMetaMystiaShowcaseGroup<T extends TMetaMystiaShowcaseTarget> {
	href: string;
	records: ReadonlyArray<IMetaMystiaShowcaseRecord<T>>;
	target: T;
}

export const META_MYSTIA_SHOWCASE_GROUPS = {
	beverages: {
		href: '/beverages',
		records: beverageCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id }) => ({ id })),
		target: 'beverage',
	},
	clothes: {
		href: '/clothes',
		records: clothesCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id }) => ({ id })),
		target: 'clothes',
	},
	foods: {
		href: '/foods',
		records: foodCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id }) => ({ id })),
		target: 'food',
	},
	ingredients: {
		href: '/ingredients',
		records: ingredientCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id }) => ({ id })),
		target: 'ingredient',
	},
} as const satisfies Record<
	string,
	IMetaMystiaShowcaseGroup<TMetaMystiaShowcaseTarget>
>;

/**
 * @description The shown ids are minted by those very catalogues, so the
 * narrowing assertions below preserve their proven association.
 */
export function getMetaMystiaShowcaseDisplayName(
	target: TMetaMystiaShowcaseTarget,
	id: number
) {
	switch (target) {
		case 'beverage':
			return beverageCatalog.getDisplayPropsById(
				id as TBeverageId,
				'name'
			);
		case 'clothes':
			return clothesCatalog.getDisplayPropsById(id as TClothesId, 'name');
		case 'food':
			return foodCatalog.getDisplayPropsById(id as TFoodId, 'name');
		case 'ingredient':
			return ingredientCatalog.getDisplayPropsById(
				id as TIngredientId,
				'name'
			);
	}
}
