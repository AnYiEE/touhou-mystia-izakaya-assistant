import {Customer} from './base';
import {CUSTOMER_NORMAL_LIST, type TCustomerNormals} from '@/data';

export class CustomerNormal extends Customer<TCustomerNormals> {
	private static _instance: CustomerNormal | undefined;

	public static getInstance() {
		if (CustomerNormal._instance !== undefined) {
			return CustomerNormal._instance;
		}

		const instance = new CustomerNormal(CUSTOMER_NORMAL_LIST);

		CustomerNormal._instance = instance;

		return instance;
	}
}
