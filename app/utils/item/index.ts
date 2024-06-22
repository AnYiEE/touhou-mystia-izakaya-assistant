import {pinyin as pinyinPro} from 'pinyin-pro';

import {generateArray, pinyinSort} from '@/utils';

import type {IItem, TItemWithPinyin} from './types';

export class Item<
	Target extends IItem[],
	Item extends Target[number] = Target[number],
	ItemWithPinyin extends TItemWithPinyin<Item> = TItemWithPinyin<Item>,
	Name extends ItemWithPinyin['name'] = ItemWithPinyin['name'],
> {
	protected _data: Target;
	protected _dataWithPinyin: ItemWithPinyin[];

	protected pinyinSortedCache?: ItemWithPinyin[];
	protected static indexNameCache: Map<number, string> = new Map();
	protected static nameIndexCache: Map<string, number> = new Map();

	public constructor(data: Target) {
		this._data = structuredClone(data);
		this._dataWithPinyin = structuredClone(this._data).map((item) => ({
			...item,
			pinyin: pinyinPro(item.name as string, {
				toneType: 'num',
				type: 'array',
				v: true,
			}),
		})) as ItemWithPinyin[];
	}

	public get data() {
		return this._dataWithPinyin;
	}

	public get dataPinyinSorted(): ItemWithPinyin[] {
		if (this.pinyinSortedCache) {
			return this.pinyinSortedCache;
		}

		this.pinyinSortedCache = this.sortByPinyin(this.data);

		return this.dataPinyinSorted;
	}

	protected checkIndexRange<_T, U extends any>(index: number, _data?: U): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(`[Item]: index \`${index}\` out of range`);
		}
	}

	public findIndexByName<T extends string = Name>(name: T) {
		if (Item.nameIndexCache.has(name)) {
			return Item.nameIndexCache.get(name)!;
		}

		const index = this._data.findIndex(({name: target}) => target === name);
		if (index === -1) {
			throw new Error(`[Item]: name \`${name}\` not found`);
		}

		Item.nameIndexCache.set(name, index);

		return index;
	}

	public findNameByIndex(index: number): Name {
		const item = this._data[index];
		this.checkIndexRange(index, item);

		if (Item.indexNameCache.has(index)) {
			return Item.indexNameCache.get(index) as Name;
		}

		const {name} = item;
		Item.indexNameCache.set(index, name);

		return name as Name;
	}

	public getPropsByIndex(index: number): ItemWithPinyin;
	public getPropsByIndex<T extends keyof ItemWithPinyin>(index: number, prop: T): ItemWithPinyin[T];
	public getPropsByIndex<T extends keyof ItemWithPinyin>(index: number, ...props: T[]): ItemWithPinyin[T][];
	public getPropsByIndex<T extends keyof ItemWithPinyin>(
		index: number,
		...props: T[]
	): ItemWithPinyin | ItemWithPinyin[T] | ItemWithPinyin[T][] {
		const item = this._dataWithPinyin[index];
		this.checkIndexRange(index, item);

		if (props.length) {
			if (props.length === 1) {
				return item[props[0] as T];
			}
			return props.map((prop) => item[prop]) as ItemWithPinyin[T][];
		}

		return item;
	}

	public getPropsByName<T extends string = Name>(name: T): ItemWithPinyin;
	public getPropsByName<
		T extends string = Name,
		U extends keyof ItemWithPinyin = keyof ItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, prop: S): ItemWithPinyin[S];
	public getPropsByName<
		T extends string = Name,
		U extends keyof ItemWithPinyin = keyof ItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): ItemWithPinyin[S][];
	public getPropsByName<
		T extends string = Name,
		U extends keyof ItemWithPinyin = keyof ItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): ItemWithPinyin | ItemWithPinyin[S] | ItemWithPinyin[S][] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<S>(index, ...(props as NonNullable<typeof props>));
	}

	public getValuesByProp<T extends keyof ItemWithPinyin>(
		data: ItemWithPinyin[],
		prop: T | T[],
		wrap: true
	): {value: FlatArray<ItemWithPinyin[T], number>}[];
	public getValuesByProp<T extends keyof ItemWithPinyin>(
		data: ItemWithPinyin[],
		prop: T | T[],
		wrap?: boolean
	): FlatArray<ItemWithPinyin[T], number>[];
	public getValuesByProp<T extends keyof ItemWithPinyin>(data: ItemWithPinyin[], prop: T | T[], wrap?: boolean) {
		const props = generateArray(prop);
		const values = [...new Set(data.map((item) => props.map((prop) => item[prop])).flat(Infinity))];

		if (wrap) {
			return values.map((value) => ({value}));
		}

		return values;
	}

	public sortByPinyin(data: ItemWithPinyin[]) {
		return data.toSorted(({pinyin: a}, {pinyin: b}) => pinyinSort(a, b));
	}
}
