import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TSpriteId, TSpriteTarget } from '@/domain/data/sprites/types';

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

export interface IMetaMystiaShowcaseRecord<T extends TSpriteTarget> {
	id: TSpriteId<T>;
	name: string;
}

export interface IMetaMystiaShowcaseGroup<T extends TSpriteTarget> {
	href: string;
	label: string;
	records: ReadonlyArray<IMetaMystiaShowcaseRecord<T>>;
	target: T;
	unit: string;
}

export const META_MYSTIA_SHOWCASE_GROUPS = {
	beverages: {
		href: '/beverages',
		label: '新酒水',
		records: beverageCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id, name }) => ({ id, name })),
		target: 'beverage',
		unit: '款',
	},
	clothes: {
		href: '/clothes',
		label: '新服装',
		records: clothesCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id, name }) => ({ id, name })),
		target: 'clothes',
		unit: '套',
	},
	foods: {
		href: '/foods',
		label: '新料理',
		records: foodCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id, name }) => ({ id, name })),
		target: 'food',
		unit: '道',
	},
	ingredients: {
		href: '/ingredients',
		label: '新食材',
		records: ingredientCatalog.data
			.filter(({ dlc }) => dlc === META_MYSTIA_DLC)
			.map(({ id, name }) => ({ id, name })),
		target: 'ingredient',
		unit: '种',
	},
} as const satisfies Record<string, IMetaMystiaShowcaseGroup<TSpriteTarget>>;
