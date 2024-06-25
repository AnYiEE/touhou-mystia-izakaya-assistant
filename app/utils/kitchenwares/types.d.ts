import type {IKitchenware as _IKitchenware} from '@/data/kitchenwares/types';
import type {TKitchenwareNames} from '@/data';

export interface IKitchenware<T extends TKitchenwareNames = TKitchenwareNames> extends _IKitchenware {
	name: T;
}
