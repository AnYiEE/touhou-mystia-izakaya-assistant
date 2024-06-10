import {customerInstances} from './customer';
import {foodInstances} from './food';
import {kitchenwareInstance} from './kitchenwares';

const instances = {
	customer: customerInstances,
	food: foodInstances,
	kitchenware: kitchenwareInstance,
} as const;

export {instances};
export {spriteInstances} from './sprite';
