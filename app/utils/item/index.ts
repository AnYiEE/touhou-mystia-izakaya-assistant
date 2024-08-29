import {cloneDeep} from 'lodash';
import {pinyin as pinyinPro} from 'pinyin-pro';

import type {IItem, TItemWithPinyin as _TItemWithPinyin} from './types';
import {pinyinSort, uniq} from '@/utils';

export class Item<
	TTarget extends IItem[],
	TItem extends TTarget[number] = TTarget[number],
	TItemWithPinyin extends _TItemWithPinyin<TItem> = _TItemWithPinyin<TItem>,
	TName extends TItemWithPinyin['name'] = TItemWithPinyin['name'],
> {
	protected _data: TTarget;
	protected _dataWithPinyin: TItemWithPinyin[];

	protected pinyinSortedCache: TItemWithPinyin[] | undefined;
	protected static indexNameCache: Map<number, string> = new Map();
	protected static nameIndexCache: Map<string, number> = new Map();

	protected constructor(data: TTarget) {
		this._data = cloneDeep(data);
		this._dataWithPinyin = this._data.map((item) => ({
			...item,
			pinyin: pinyinPro(item.name, {
				toneType: 'num',
				type: 'array',
				v: true,
			}),
		})) as TItemWithPinyin[];
	}

	public get data() {
		return this._dataWithPinyin;
	}

	public get dataPinyinSorted(): TItemWithPinyin[] {
		if (this.pinyinSortedCache) {
			return this.pinyinSortedCache;
		}

		this.pinyinSortedCache = this.sortByPinyin(this.data);

		return this.dataPinyinSorted;
	}

	protected checkIndexRange(index: number, _data?: unknown): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(`[utils/Item]: index \`${index}\` out of range`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public findIndexByName<T extends string = TName>(name: T) {
		if (Item.nameIndexCache.has(name)) {
			return Item.nameIndexCache.get(name);
		}

		const index = this._data.findIndex(({name: target}) => target === name);
		if (index === -1) {
			throw new Error(`[utils/Item]: name \`${name}\` not found`);
		}

		Item.nameIndexCache.set(name, index);

		return index;
	}

	public findNameByIndex(index: number): TName {
		const item = this._data[index];
		this.checkIndexRange(index, item);

		if (Item.indexNameCache.has(index)) {
			return Item.indexNameCache.get(index) as TName;
		}

		const {name} = item;
		Item.indexNameCache.set(index, name);

		return name as TName;
	}

	public getPropsByIndex(index: number): TItemWithPinyin;
	public getPropsByIndex<T extends keyof TItemWithPinyin>(index: number, prop: T): TItemWithPinyin[T];
	public getPropsByIndex<T extends keyof TItemWithPinyin>(index: number, ...props: T[]): TItemWithPinyin[T][];
	public getPropsByIndex<T extends keyof TItemWithPinyin>(
		index: number,
		...props: T[]
	): TItemWithPinyin | TItemWithPinyin[T] | TItemWithPinyin[T][] {
		const item = this._dataWithPinyin[index];
		this.checkIndexRange(index, item);

		if (props.length > 0) {
			if (props.length === 1) {
				return item[props[0] as T];
			}
			return props.map((prop) => item[prop]) as TItemWithPinyin[T][];
		}

		return item;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public getPropsByName<T extends string = TName>(name: T): TItemWithPinyin;
	public getPropsByName<
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
		T extends string = TName,
		U extends keyof TItemWithPinyin = keyof TItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, prop: S): TItemWithPinyin[S];
	public getPropsByName<
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
		T extends string = TName,
		U extends keyof TItemWithPinyin = keyof TItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): TItemWithPinyin[S][];
	public getPropsByName<
		T extends string = TName,
		U extends keyof TItemWithPinyin = keyof TItemWithPinyin,
		S extends Exclude<U, 'name'> = Exclude<U, 'name'>,
	>(name: T, ...props: S[]): TItemWithPinyin | TItemWithPinyin[S] | TItemWithPinyin[S][] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<S>(index, ...props);
	}

	public getValuesByProp<T extends keyof TItemWithPinyin>(
		data: TItemWithPinyin[],
		prop: T | T[],
		wrap: true
	): {value: FlatArray<TItemWithPinyin[T], number>}[];
	public getValuesByProp<T extends keyof TItemWithPinyin>(
		data: TItemWithPinyin[],
		prop: T | T[],
		wrap?: boolean
	): FlatArray<TItemWithPinyin[T], number>[];
	public getValuesByProp<T extends keyof TItemWithPinyin>(data: TItemWithPinyin[], prop: T | T[], wrap?: boolean) {
		const props = [prop].flat(Infinity) as T[];
		const values = uniq(data.map((item) => props.map((key) => item[key])).flat(Infinity));

		if (wrap) {
			return values.map((value) => ({value}));
		}

		return values;
	}

	public sortByPinyin(data: TItemWithPinyin[]) {
		return [...data].sort(({pinyin: a}, {pinyin: b}) => pinyinSort(a, b));
	}
}
