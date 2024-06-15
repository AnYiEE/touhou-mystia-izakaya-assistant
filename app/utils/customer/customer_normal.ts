import {Customer} from './base';
import {type CustomerNormals} from '@/data';

export class CustomerNormal extends Customer<CustomerNormals> {
	constructor(data: CustomerNormals) {
		super(data);

		this._data = data;
	}
}
