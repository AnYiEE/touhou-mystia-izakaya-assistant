import {Item} from '@/utils/item';
import type {IKitchenware} from './types';

export class Kitchenware<TTarget extends IKitchenware[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}
}
