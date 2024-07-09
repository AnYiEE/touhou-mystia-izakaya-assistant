import {Item} from '@/utils/item';
import type {ICooker} from './types';

export class Cooker<TTarget extends ICooker[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}
}
