import type {IKitchenware as _IKitchenware} from '@/data/kitchenwares/types';
import type {KitchenwareNames} from '@/data/kitchenwares';

interface IKitchenware<T extends KitchenwareNames = KitchenwareNames> extends _IKitchenware {
	name: T;
}

export type {IKitchenware};
