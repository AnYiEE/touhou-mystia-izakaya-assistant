import {customerInstanceMap} from '../constants';
import type {TCustomerTarget} from '../types';

export function getCustomerInstance(costomer: TCustomerTarget) {
	return customerInstanceMap[costomer as 'customer_rare'];
}
