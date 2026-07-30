import { attachAvailabilityData } from '@/domain/availability/catalog';
import type { TAvailabilityCategory } from '@/domain/availability/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { copyArray } from '@/shared/utilities/collections/convert';
import { cloneJsonObject } from '@/shared/utilities/objects/cloneJsonObject';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { getPinyin } from '@/shared/utilities/pinyin/getPinyin';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import type {
	IItem,
	TAvailabilityItemWithPinyin,
	TItemWithPinyin,
} from './types';

type DeepFlatElement<T> =
	T extends ReadonlyArray<infer E> ? DeepFlatElement<E> : T;

function appendDeepArrayValues(values: Set<unknown>, value: unknown) {
	if (!Array.isArray(value)) {
		values.add(value);
		return;
	}

	for (let index = 0; index < value.length; index += 1) {
		if (index in value) {
			appendDeepArrayValues(values, value[index]);
		}
	}
}

function isReadonlyArray<T>(
	value: T | ReadonlyArray<T>
): value is ReadonlyArray<T> {
	return Array.isArray(value);
}

export class Item<
	TItems extends IItem[],
	TItem extends TItemWithPinyin<TItems[number]> = TAvailabilityItemWithPinyin<
		TItems[number]
	>,
	TItemId extends TItem['id'] = TItem['id'],
	TItemName extends TItem['name'] = TItem['name'],
> {
	protected _data: ReadonlyArray<TItem>;

	protected _indexNameCache: Map<number, TItemName>;
	protected _nameIndexCache: Map<TItemName, number>;
	protected _pinyinSortedDataCacheMap: WeakMap<
		ReadonlyArray<TItem>,
		ReadonlyArray<TItem>
	>;

	protected constructor(data: TItems, category?: TAvailabilityCategory) {
		const dataWithAvailability =
			category === undefined
				? data
				: attachAvailabilityData(category, data);
		this._data = cloneJsonObject(dataWithAvailability).map((item) => ({
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

	public formatId(id: TItemId) {
		if (id >= 0) {
			return id.toString().padStart(4, '0');
		}
		return id.toString();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected checkIndexRange(index: number, _data?: unknown): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(
				`[domain/catalog/shared/Item]: index \`${index}\` out of range`
			);
		}
	}

	public findIndexByName(name: TItemName) {
		if (this._nameIndexCache.has(name)) {
			return this._nameIndexCache.get(name);
		}

		const index = this._data.findIndex(
			({ name: target }) => target === name
		);
		if (index === -1) {
			throw new Error(
				`[domain/catalog/shared/Item]: name \`${name}\` not found`
			);
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

		const { name } = item;
		this._indexNameCache.set(index, name as TItemName);

		return name;
	}

	public getPropsByIndex(index: number): TItem;
	public getPropsByIndex(index: number, prop: 'name'): TItemName;
	public getPropsByIndex<T extends keyof TItem>(
		index: number,
		prop: T
	): TItem[T];
	public getPropsByIndex<T extends keyof TItem>(
		index: number,
		...props: T[]
	): Array<TItem[T]>;
	public getPropsByIndex<T extends keyof TItem>(
		index: number,
		...props: T[]
	): TItem | TItem[T] | Array<TItem[T]> {
		const item = this._data[index];
		this.checkIndexRange(index, item);

		if (!checkLengthEmpty(props)) {
			if (props.length === 1) {
				return item[props[0] as T];
			}
			return props.map((prop) => item[prop]);
		}

		return item;
	}

	public getPropsByName(name: TItemName): TItem;
	public getPropsByName(name: TItemName, prop: 'name'): TItemName;
	public getPropsByName<T extends keyof TItem, U extends Exclude<T, 'name'>>(
		name: TItemName,
		prop: U
	): TItem[U];
	public getPropsByName<T extends keyof TItem, U extends Exclude<T, 'name'>>(
		name: TItemName,
		...props: U[]
	): Array<TItem[U]>;
	public getPropsByName<T extends keyof TItem, U extends Exclude<T, 'name'>>(
		name: TItemName,
		...props: U[]
	): TItem | TItem[U] | Array<TItem[U]> {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<U>(index, ...props);
	}

	public getValuesByProp<T extends keyof TItem>(
		prop: T | ReadonlyArray<T>,
		wrap: true,
		data?: ReadonlyArray<TItem>
	): Array<ValueCollection<DeepFlatElement<TItem[T]>>>;
	public getValuesByProp<T extends keyof TItem>(
		prop: T | ReadonlyArray<T>,
		wrap?: boolean,
		data?: ReadonlyArray<TItem>
	): Array<DeepFlatElement<TItem[T]>>;
	public getValuesByProp<T extends keyof TItem>(
		prop: T | ReadonlyArray<T>,
		wrap?: boolean,
		data?: ReadonlyArray<TItem>
	) {
		const target = data ?? this._data;

		const props = isReadonlyArray(prop) ? prop : [prop];
		const values = new Set<unknown>();

		for (let itemIndex = 0; itemIndex < target.length; itemIndex += 1) {
			if (!(itemIndex in target)) {
				continue;
			}

			// The preceding sparse-slot guard proves this indexed value exists.
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const item = target[itemIndex]!;
			for (let index = 0; index < props.length; index += 1) {
				if (index in props) {
					// The sparse-slot guard proves this property key exists.
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const key = props[index]!;
					appendDeepArrayValues(values, item[key]);
				}
			}
		}

		const result = [...values];
		return wrap ? result.map(toGetValueCollection) : result;
	}

	public getNames(length?: number) {
		if (length === 0) {
			return [];
		}

		if (length === undefined || length > this._data.length) {
			length = this._data.length;
		}

		return Array.from({ length }, (_, index) =>
			this.findNameByIndex(index)
		);
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
		return copyArray(data).sort(({ pinyin: a }, { pinyin: b }) =>
			pinyinSort(a, b)
		);
	}
}
