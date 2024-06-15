import {customerInstances} from './customer';
import {foodInstances} from './food';
import {kitchenwareInstance} from './kitchenwares';

export const instances = {
	customer: customerInstances,
	food: foodInstances,
	kitchenware: kitchenwareInstance,
} as const;

export {spriteInstances} from './sprite';
