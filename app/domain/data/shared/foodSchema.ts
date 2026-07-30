import type {
	TCollectionLocation,
	TMerchant,
	TPlace,
	TTask,
} from '@/domain/data/places/types';

import type { IItemBase } from './itemSchema';
import type { TLevel } from './types';

export interface IFoodFrom {
	/** @description If it is an array, the first element represents the merchant selling the item, and the second element represents the probability of sale. */
	buy: Array<TMerchant | [TMerchant, boolean | number]>;
	/** @description If it is an array, the first element represents the collection location, and the second element represents the probability of acquisition. If there are two additional elements, they represent the time points for the appearance and disappearance of the collection location. */
	collect: Array<
		| TCollectionLocation
		| [TCollectionLocation, boolean | number]
		| [TCollectionLocation, boolean | number, number, number]
	>;
	fishing: TPlace[];
	fishingAdvanced: TPlace[];
	task: TTask[];
}

export interface IFoodBase extends IItemBase {
	level: TLevel;
	price: number;
	from: Partial<IFoodFrom>;
}
