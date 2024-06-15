import {Item} from '@/utils/item';
import type {IFood} from './types';

export class Food<Target extends IFood[]> extends Item<Target> {
	public constructor(data: Target) {
		super(data);

		this._data = data;
	}
}
