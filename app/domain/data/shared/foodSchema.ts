import type {
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';

import type { IItemBase } from './itemSchema';
import type { TLevel } from './types';

export interface IFoodFrom {
	/** @description If it is an array, the first element represents the merchant selling the item, and the second element represents the probability of sale. */
	buy: Array<TMerchantReference | [TMerchantReference, boolean | number]>;
	/** @description If it is an array, the first element represents the collection location, and the second element represents the probability of acquisition. If there are two additional elements, they represent the time points for the appearance and disappearance of the collection location. */
	collect: Array<
		| TCollectionPointReference
		| [TCollectionPointReference, boolean | number]
		| [TCollectionPointReference, boolean | number, number, number]
	>;
	fishing: TMapLabel[];
	fishingAdvanced: TMapLabel[];
	task: ITaskReference[];
}

export interface IFoodBase extends IItemBase {
	from: Partial<IFoodFrom>;
	level: TLevel;
	price: number;
}
