import {CUSTOMER_RARE_TAG_STYLE, CUSTOMER_SPECIAL_TAG_STYLE} from '@/constants';
import {instances} from '@/methods';

export const {
	customer: {customer_rare: instance_rate, customer_special: instance_special},
	food: {beverage: instance_beverage, recipe: instance_recipe},
} = instances;

export const customerInstanceMap = {
	customer_rare: instance_rate,
	customer_special: instance_special,
} as const;

export const customerTagStyleMap = {
	customer_rare: CUSTOMER_RARE_TAG_STYLE,
	customer_special: CUSTOMER_SPECIAL_TAG_STYLE,
} as const;
