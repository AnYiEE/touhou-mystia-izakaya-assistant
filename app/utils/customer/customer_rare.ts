import {Customer} from './base';
import {CUSTOMER_RARE_LIST, type TCustomerRares} from '@/data';

export class CustomerRare extends Customer<TCustomerRares> {
	private static _instance: CustomerRare | undefined;

	private constructor(data: TCustomerRares) {
		super(data);

		this._data = data;
	}

	public static getInstance() {
		if (CustomerRare._instance) {
			return CustomerRare._instance;
		}

		const instance = new CustomerRare(CUSTOMER_RARE_LIST);

		CustomerRare._instance = instance;

		return instance;
	}
}
