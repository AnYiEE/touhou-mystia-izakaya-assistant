import {Item} from '@/utils/item';
import type {IKitchenware} from './types';

export class Kitchenware<Target extends IKitchenware[]> extends Item<Target> {
	public constructor(data: Target) {
		super(data);

		this._data = data;
	}
}
