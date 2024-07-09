import type {TCookerInstance} from './cookers/types';
import type {TCustomerInstances} from './customer/types';
import type {TFoodInstances} from './food/types';

export type TInstances = TCustomerInstances | TFoodInstances | TCookerInstance;
export type {TCookerInstance} from './cookers/types';
export type {TCustomerInstances} from './customer/types';
export type {TFoodInstances} from './food/types';

export type {TSpriteInstances} from './sprite/types';
