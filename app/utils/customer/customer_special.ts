import {Customer} from './base';
import {CUSTOMER_SPECIAL_LIST, type TCustomerSpecials} from '@/data';

export class CustomerSpecial extends Customer<TCustomerSpecials> {
	private static _instance: CustomerSpecial | undefined;

	public static getInstance() {
		if (CustomerSpecial._instance) {
			return CustomerSpecial._instance;
		}

		const instance = new CustomerSpecial(CUSTOMER_SPECIAL_LIST);

		CustomerSpecial._instance = instance;

		return instance;
	}
}
