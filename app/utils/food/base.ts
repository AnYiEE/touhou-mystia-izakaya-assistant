import type {IFood} from './types';
import {intersection} from '@/utils';
import {Item} from '@/utils/item';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}

	/**
	 * @description Obtain the common elements and their counts between two different string arrays.
	 * The type of the returned `commonTags` is changed to that of the second array to avoid type errors.
	 */
	public getCommonTags<T extends string, U extends string>(arrayA: T[], arrayB: U[]) {
		const intersectionArray = intersection(arrayA as unknown as U[], arrayB);

		return {
			commonTags: intersectionArray,
			count: intersectionArray.length,
		};
	}
}
