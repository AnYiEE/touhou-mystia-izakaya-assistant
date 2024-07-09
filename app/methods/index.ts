import {cookerInstance} from './cookers';
import {customerInstances} from './customer';
import {foodInstances} from './food';

export const instances = {
	cooker: cookerInstance,
	customer: customerInstances,
	food: foodInstances,
} as const;

export {spriteInstances} from './sprite';
