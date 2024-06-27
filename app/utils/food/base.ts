import {Item} from '@/utils/item';
import type {IFood} from './types';

export class Food<TTarget extends IFood[]> extends Item<TTarget> {
	public constructor(data: TTarget) {
		super(data);

		this._data = data;
	}

	public getCommonTags<T>(arrayA: T[], arrayB: T[]) {
		const setArrayB = new Set(arrayB);

		const commonTags: T[] = [];
		let count = 0;

		for (const item of arrayA) {
			if (setArrayB.has(item)) {
				commonTags.push(item);
				count++;
			}
		}

		return {
			commonTags,
			count,
		};
	}
}
