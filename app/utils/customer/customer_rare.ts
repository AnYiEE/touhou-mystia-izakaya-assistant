import {Customer} from './base';
import type {CustomerRares} from '@/data/customer_rare';

class CustomerRare extends Customer<CustomerRares> {
	constructor(data: CustomerRares) {
		super(data);

		this._data = data;
	}
}

export {CustomerRare};
