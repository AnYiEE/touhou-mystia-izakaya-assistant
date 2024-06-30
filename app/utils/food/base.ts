import {Item} from '@/utils/item';
import type {IFood} from './types';
import {getIntersection} from '@/utils';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}

	public getCommonTags<T extends string, U extends string>(arrayA: T[], arrayB: U[]) {
		const intersectionArray = getIntersection(arrayA as unknown as U[], arrayB);

		return {
			commonTags: intersectionArray,
			count: intersectionArray.length,
		};
	}
}
