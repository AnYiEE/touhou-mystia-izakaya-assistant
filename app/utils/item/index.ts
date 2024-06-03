import type {IItem} from './types';

class Item<Target extends IItem[]> {
	protected _data: Target;

	protected static indexNameCache: Map<number, string> = new Map();
	protected static nameIndexCache: Map<string, number> = new Map();

	public constructor(data: Target) {
		this._data = data;
	}

	public get data() {
		return structuredClone(this._data);
	}

	protected checkIndexRange<_T, U extends Target[number] | undefined>(index: number, _data?: U): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(`[Item]: index \`${index}\` out of range`);
		}
	}

	public findIndexByName<T extends string = Target[number]['name']>(name: T) {
		if (Item.nameIndexCache.has(name)) {
			return Item.nameIndexCache.get(name)!;
		}

		const index: number = this._data.findIndex(({name: target}) => target === name);
		if (index === -1) {
			throw new Error(`[Item]: name \`${name}\` not found`);
		}

		Item.nameIndexCache.set(name, index);

		return index;
	}

	public findNameByIndex<T extends string = Target[number]['name']>(index: number): T {
		const item = this._data[index];
		this.checkIndexRange(index, item);

		if (Item.indexNameCache.has(index)) {
			return Item.indexNameCache.get(index) as T;
		}

		const {name} = item;
		Item.indexNameCache.set(index, name);

		return name as T;
	}
}

export {Item};
