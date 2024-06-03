import {Item} from '@/utils/item';
import type {IFood} from './types';

class Food<Target extends IFood[]> extends Item<Target> {
	public constructor(data: Target) {
		super(data);

		this._data = data;
	}

	public getPropsByIndex<T extends Target[number]>(index: number): T;
	public getPropsByIndex<T extends Target[number]>(index: number, prop: keyof T): T[keyof T];
	public getPropsByIndex<T extends Target[number]>(index: number, prop?: keyof T): T | T[keyof T] {
		const food = this._data[index];
		this.checkIndexRange(index, food);

		if (!prop) {
			return food as T;
		}

		return food[prop as keyof IFood] as T[keyof T];
	}

	public getPropsByName<T extends Target[number], U extends T['name']>(name: U): T;
	public getPropsByName<T extends Target[number], U extends T['name'], S extends Exclude<keyof T, 'name'>>(
		name: U,
		prop: S
	): T[S];
	public getPropsByName<T extends Target[number], U extends T['name'], S extends Exclude<keyof T, 'name'>>(
		name: U,
		prop?: S
	): T | T[S] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<T>(index, prop as NonNullable<typeof prop>) as T | T[S];
	}
}

export {Food};
