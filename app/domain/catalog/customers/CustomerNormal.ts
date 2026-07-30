import { CUSTOMER_NORMAL_LIST } from '@/domain/data/customers/normal/records';
import type { TCustomerNormals } from '@/domain/data/customers/normal/types';

import { Customer } from './Customer';

export class CustomerNormal extends Customer<TCustomerNormals> {
	private static _instance: CustomerNormal | undefined;

	public static getInstance() {
		if (CustomerNormal._instance !== undefined) {
			return CustomerNormal._instance;
		}

		const instance = new CustomerNormal(
			CUSTOMER_NORMAL_LIST,
			'customerNormal'
		);

		CustomerNormal._instance = instance;

		return instance;
	}
}
