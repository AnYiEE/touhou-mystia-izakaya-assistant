import {cloneDeep} from 'lodash';

import type {IItem, TItemWithPinyin} from './types';

import {copyArray, getPinyin, pinyinSort, toGetValueCollection, union} from '@/utilities';

export class Item<
	TItems extends IItem[],
	TItem extends TItemWithPinyin<TItems[number]> = TItemWithPinyin<TItems[number]>,
	TItemName extends TItem['name'] = TItem['name'],
> {
	protected _data: ReadonlyArray<TItem>;

	protected _indexNameCache: Map<number, TItemName>;
	protected _nameIndexCache: Map<string, number>;
	protected _pinyinSortedDataCacheMap: WeakMap<ReadonlyArray<TItem>, ReadonlyArray<TItem>>;

	protected constructor(data: TItems) {
		this._data = cloneDeep(data).map((item) => ({
			...item,
			pinyin: getPinyin(item.name),
		})) as TItem[];

		this._indexNameCache = new Map();
		this._nameIndexCache = new Map();
		this._pinyinSortedDataCacheMap = new WeakMap();
	}

	public get data() {
		return this._data;
	}

	protected checkIndexRange(index: number, _data?: unknown): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(`[utils/item/Item]: index \`${index}\` out of range`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public findIndexByName<T extends string = TItemName>(name: T) {
		if (this._nameIndexCache.has(name)) {
			return this._nameIndexCache.get(name);
		}

		const index = this._data.findIndex(({name: target}) => target === name);
		if (index === -1) {
			throw new Error(`[utils/item/Item]: name \`${name}\` not found`);
		}

		this._nameIndexCache.set(name, index);

		return index;
	}

	public findNameByIndex(index: number) {
		if (this._indexNameCache.has(index)) {
			return this._indexNameCache.get(index);
		}

		const item = this._data[index];
		this.checkIndexRange(index, item);

		const {name} = item;
		this._indexNameCache.set(index, name as TItemName);

		return name;
	}

	public getPropsByIndex(index: number): TItem;
	public getPropsByIndex(index: number, prop: 'name'): TItemName;
	public getPropsByIndex<T extends keyof TItem>(index: number, prop: T): TItem[T];
	public getPropsByIndex<T extends keyof TItem>(index: number, ...props: T[]): TItem[T][];
	public getPropsByIndex<T extends keyof TItem>(index: number, ...props: T[]): TItem | TItem[T] | TItem[T][] {
		const item = this._data[index];
		this.checkIndexRange(index, item);

		if (props.length > 0) {
			if (props.length === 1) {
				return item[props[0] as T];
			}
			return props.map((prop) => item[prop]) as TItem[T][];
		}

		return item;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getPropsByName<T extends string = TItemName>(name: T): TItem;
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getPropsByName<T extends string = TItemName>(name: T, prop: 'name'): TItemName;
	public getPropsByName<
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
		T extends string = TItemName,
		U extends keyof TItem = keyof TItem,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, prop: S): TItem[S];
	public getPropsByName<
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
		T extends string = TItemName,
		U extends keyof TItem = keyof TItem,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): TItem[S][];
	public getPropsByName<
		T extends string = TItemName,
		U extends keyof TItem = keyof TItem,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): TItem | TItem[S] | TItem[S][] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<S>(index, ...props);
	}

	public getValuesByProp<T extends keyof TItem>(
		prop: T | T[],
		wrap: true,
		data?: ReadonlyArray<TItem>
	): {value: FlatArray<TItem[T], number>}[];
	public getValuesByProp<T extends keyof TItem>(
		prop: T | T[],
		wrap?: boolean,
		data?: ReadonlyArray<TItem>
	): FlatArray<TItem[T], number>[];
	public getValuesByProp<T extends keyof TItem>(prop: T | T[], wrap?: boolean, data?: ReadonlyArray<TItem>) {
		const target = data ?? this._data;

		const props = [prop].flat() as T[];
		const values = union(target.map((item) => props.map((key) => item[key])).flat(Infinity));

		if (wrap) {
			return values.map(toGetValueCollection);
		}

		return values;
	}

	public getNames(length?: number) {
		if (length === 0) {
			return [];
		}

		if (length === undefined || length > this._data.length) {
			length = this._data.length;
		}

		return Array.from({length}, (_, index) => this.findNameByIndex(index));
	}

	public getPinyinSortedData(data?: ReadonlyArray<TItem>) {
		const target = data ?? this._data;

		const generateReturn = (returnData: typeof target) => ({
			fork: () => copyArray(returnData),
			get: () => returnData,
		});

		if (this._pinyinSortedDataCacheMap.has(target)) {
			return generateReturn(this._pinyinSortedDataCacheMap.get(target));
		}

		const sortedData = this.sortByPinyin(target);
		this._pinyinSortedDataCacheMap.set(target, sortedData);

		return generateReturn(sortedData);
	}

	private sortByPinyin(data: ReadonlyArray<TItem>) {
		return copyArray(data).sort(({pinyin: a}, {pinyin: b}) => pinyinSort(a, b));
	}
}
