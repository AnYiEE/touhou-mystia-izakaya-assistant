import {cloneDeep} from 'lodash';

import type {IItem, TItemWithPinyin as _TItemWithPinyin} from './types';
import {pinyinPro, pinyinSort, toValueObject, union} from '@/utils';

export class Item<
	TTarget extends IItem[],
	TItem extends TTarget[number] = TTarget[number],
	TItemWithPinyin extends _TItemWithPinyin<TItem> = _TItemWithPinyin<TItem>,
	TId extends TItem['id'] = TItem['id'],
	TName extends TItemWithPinyin['name'] = TItemWithPinyin['name'],
> {
	protected _data: TTarget;
	protected _dataWithPinyin: ReadonlyArray<TItemWithPinyin>;

	protected _pinyinSortedCache: ReadonlyArray<TItemWithPinyin> | null;
	protected _idIndexCache: Map<number, number>;
	protected _indexIdCache: Map<number, number>;

	protected constructor(data: TTarget) {
		this._data = cloneDeep(data);
		this._dataWithPinyin = this._data.map((item) => ({
			...item,
			pinyin: pinyinPro(item.name),
		})) as TItemWithPinyin[];

		this._pinyinSortedCache = null;
		this._idIndexCache = new Map();
		this._indexIdCache = new Map();
	}

	public get data() {
		return this._dataWithPinyin;
	}

	public get dataPinyinSorted(): ReadonlyArray<TItemWithPinyin> {
		if (this._pinyinSortedCache !== null) {
			return this._pinyinSortedCache;
		}

		this._pinyinSortedCache = this.sortByPinyin(this.data);

		return this.dataPinyinSorted;
	}

	protected checkIndexRange(index: number, _data?: unknown): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(`[utils/Item]: index \`${index}\` out of range`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	public findIndexById<T extends number = TId>(id: T) {
		if (this._idIndexCache.has(id)) {
			return this._idIndexCache.get(id);
		}

		const index = this._data.findIndex(({id: target}) => target === id);
		if (index === -1) {
			throw new Error(`[utils/Item]: id \`${id}\` not found`);
		}

		this._idIndexCache.set(id, index);

		return index;
	}

	public findIdByIndex(index: number) {
		if (this._indexIdCache.has(index)) {
			return this._indexIdCache.get(index) as TId;
		}

		const item = this._data[index];
		this.checkIndexRange(index, item);

		const {id} = item;
		this._indexIdCache.set(index, id);

		return id as TId;
	}

	public getNames(length?: number) {
		if (length === 0) {
			return [];
		}

		if (length === undefined || length > this._data.length) {
			length = this._data.length;
		}

		return Array.from({length}, (_, index) => this.getPropsByIndex(index, 'name'));
	}

	public getPropsById(id: TId): TItemWithPinyin;
	public getPropsById(id: TId, prop: 'name'): TName;
	public getPropsById<T extends keyof TItemWithPinyin>(id: TId, prop: T): TItemWithPinyin[T];
	public getPropsById<T extends keyof TItemWithPinyin>(id: TId, ...props: T[]): TItemWithPinyin[T][];
	public getPropsById<T extends keyof TItemWithPinyin>(
		id: TId,
		...props: T[]
	): TItemWithPinyin | TItemWithPinyin[T] | TItemWithPinyin[T][] {
		const index = this.findIndexById(id);

		return this.getPropsByIndex(index, ...props);
	}

	public getPropsByIndex(index: number): TItemWithPinyin;
	public getPropsByIndex(index: number, prop: 'name'): TName;
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

	public getValuesByProp<T extends keyof TItemWithPinyin>(
		data: ReadonlyArray<TItemWithPinyin>,
		prop: T | T[],
		wrap: true
	): {value: FlatArray<TItemWithPinyin[T], number>}[];
	public getValuesByProp<T extends keyof TItemWithPinyin>(
		data: ReadonlyArray<TItemWithPinyin>,
		prop: T | T[],
		wrap?: boolean
	): FlatArray<TItemWithPinyin[T], number>[];
	public getValuesByProp<T extends keyof TItemWithPinyin>(
		data: ReadonlyArray<TItemWithPinyin>,
		prop: T | T[],
		wrap?: boolean
	) {
		const props = [prop].flat(Infinity) as T[];
		const values = union(data.map((item) => props.map((key) => item[key])).flat(Infinity));

		if (wrap) {
			return values.map(toValueObject);
		}

		return values;
	}

	public sortByPinyin(data: ReadonlyArray<TItemWithPinyin>) {
		return [...data].sort(({pinyin: a}, {pinyin: b}) => pinyinSort(a, b));
	}
}
