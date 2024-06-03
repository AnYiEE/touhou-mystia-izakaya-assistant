import {Customer} from './base';
import type {CustomerNormals} from '@/data/customer_normal';

class CustomerNormal extends Customer<CustomerNormals> {
	constructor(data: CustomerNormals) {
		super(data);

		this._data = data;
	}
}

export {CustomerNormal};
