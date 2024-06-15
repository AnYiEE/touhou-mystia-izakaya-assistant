import {Item} from '@/utils/item';
import type {ICustomer} from './types';

export class Customer<Target extends ICustomer[]> extends Item<Target> {
	public constructor(data: Target) {
		super(data);

		this._data = data;
	}
}
