import {intersection} from 'lodash';

import type {IFood} from './types';
import {Item} from '@/utils/item';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}

	public getCommonTags<T extends string, U extends string>(arrayA: T[], arrayB: U[]) {
		const intersectionArray = intersection(arrayA as unknown as U[], arrayB);

		return {
			commonTags: intersectionArray,
			count: intersectionArray.length,
		};
	}
}
