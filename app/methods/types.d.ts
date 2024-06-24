import type {CustomerInstances} from './customer/types';
import type {FoodInstances} from './food/types';
import type {KitchenwareInstance} from './kitchenwares/types';

export type Instances = CustomerInstances | FoodInstances | KitchenwareInstance;
export type {CustomerInstances} from './customer/types';
export type {FoodInstances} from './food/types';
export type {KitchenwareInstance} from './kitchenwares/types';

export type {SpriteInstances} from './sprite/types';
