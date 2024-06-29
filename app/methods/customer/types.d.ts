import {
	type customerInstances,
	type customerNormalInstance,
	type customerRareInstance,
	type customerSpecialInstance,
} from './index';

export type TCustomerNormalInstances = typeof customerNormalInstance;
export type TCustomerRareInstances = typeof customerRareInstance;
export type TCustomerSpecialInstances = typeof customerSpecialInstance;

export type TCustomerInstances = (typeof customerInstances)[keyof typeof customerInstances];
