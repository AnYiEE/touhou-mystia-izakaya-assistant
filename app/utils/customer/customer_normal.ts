import {Customer} from './base';
import {type TCustomerNormals} from '@/data';

export class CustomerNormal extends Customer<TCustomerNormals> {
	constructor(data: TCustomerNormals) {
		super(data);

		this._data = data;
	}
}
