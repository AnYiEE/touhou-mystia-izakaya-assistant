import type {TCustomerInstances} from './customer/types';
import type {TFoodInstances} from './food/types';
import type {TKitchenwareInstance} from './kitchenwares/types';

export type TInstances = TCustomerInstances | TFoodInstances | TKitchenwareInstance;
export type {TCustomerInstances} from './customer/types';
export type {TFoodInstances} from './food/types';
export type {TKitchenwareInstance} from './kitchenwares/types';

export type {TSpriteInstances} from './sprite/types';
