import {type ReactNode} from 'react';

import {type instance_recipe} from './constants';
import {type TCustomerNames} from '@/data';

export type TCustomerTarget = 'customer_rare' | 'customer_special';

export interface ICurrentCustomer {
	name: TCustomerNames;
	target: TCustomerTarget;
}

export interface ICustomerTabState {
	label: 'expand' | 'collapse';
	buttonNode: ReactNode;
	contentClassName: string;
	sideButtonGroupClassName: string;
}

export type TRecipes = (typeof instance_recipe)['data'];
export type TRecipe = TRecipes[number];
