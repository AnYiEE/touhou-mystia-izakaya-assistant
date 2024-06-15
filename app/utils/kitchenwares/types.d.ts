import type {IKitchenware as _IKitchenware} from '@/data/kitchenwares/types';
import type {KitchenwareNames} from '@/data';

export interface IKitchenware<T extends KitchenwareNames = KitchenwareNames> extends _IKitchenware {
	name: T;
}
