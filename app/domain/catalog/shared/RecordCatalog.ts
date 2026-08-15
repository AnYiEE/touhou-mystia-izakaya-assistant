import { attachAvailabilityData } from '@/domain/availability/catalog';
import type { TAvailabilityCategory } from '@/domain/availability/types';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
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

const EMPTY_INDEX_LIST: ReadonlyArray<number> = [];

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

export class RecordCatalog<
	TItems extends IItem[],
	TItem extends TItemWithPinyin<TItems[number]> = TAvailabilityItemWithPinyin<
		TItems[number]
	>,
	TItemId extends TItem['id'] = TItem['id'],
	TItemName extends TItem['name'] = TItem['name'],
> {
	protected readonly _data: ReadonlyArray<TItem>;

	private readonly _idIndexCache: Map<TItem['id'], number>;
	private readonly _indexNameCache: Map<number, TItemName>;
	private readonly _nameIndicesCache: Map<TItemName, number[]>;
	private readonly _pinyinSortedDataCacheMap: WeakMap<
		ReadonlyArray<TItem>,
		ReadonlyArray<TItem>
	>;

	protected constructor(data: TItems, category?: TAvailabilityCategory) {
		const dataWithAvailability =
			category === undefined
				? data
				: attachAvailabilityData(category, data);
		this._data = structuredClone(dataWithAvailability).map((item) => ({
			...item,
			pinyin: getPinyin(item.name),
		})) as TItem[];

		this._idIndexCache = new Map();
		this._indexNameCache = new Map();
		this._nameIndicesCache = new Map();
		this._pinyinSortedDataCacheMap = new WeakMap();
		for (let index = 0; index < this._data.length; index += 1) {
			const item = this._data[index];
			this.checkIndexRange(index, item);
			if (this._idIndexCache.has(item.id)) {
				throw new Error(
					`[domain/catalog/shared/RecordCatalog]: duplicate id \`${item.id}\``
				);
			}

			this._idIndexCache.set(item.id, index);
			const itemName = item.name as TItemName;
			const nameIndices = this._nameIndicesCache.get(itemName);
			if (nameIndices === undefined) {
				this._nameIndicesCache.set(itemName, [index]);
			} else {
				nameIndices.push(index);
			}
		}
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

	public findIndexById(id: TItem['id']) {
		const index = this._idIndexCache.get(id);
		if (index === undefined) {
			throw new Error(
				`[domain/catalog/shared/RecordCatalog]: id \`${id}\` not found`
			);
		}

		return index;
	}

	public findIndicesByName(name: TItemName): ReadonlyArray<number> {
		return this._nameIndicesCache.get(name) ?? EMPTY_INDEX_LIST;
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

	public findIdByIndex(index: number) {
		return this.getPropsByIndex(index, 'id');
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

	public getPropsById(id: TItem['id']): TItem;
	public getPropsById(id: TItem['id'], prop: 'name'): TItemName;
	public getPropsById<T extends keyof TItem>(
		id: TItem['id'],
		prop: T
	): TItem[T];
	public getPropsById<T extends keyof TItem>(
		id: TItem['id'],
		...props: T[]
	): Array<TItem[T]>;
	public getPropsById<T extends keyof TItem>(
		id: TItem['id'],
		...props: T[]
	): TItem | TItem[T] | Array<TItem[T]> {
		return this.getPropsByIndex<T>(this.findIndexById(id), ...props);
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

			const item = target[itemIndex] as TItem;
			for (let index = 0; index < props.length; index += 1) {
				if (index in props) {
					const key = props[index] as T;
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
		return this._pinyinSortedDataCacheMap.getOrInsertComputed(
			target,
			this.sortByPinyin
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected checkIndexRange(index: number, _data?: unknown): asserts _data {
		if (index < 0 || index >= this._data.length) {
			throw new Error(
				`[domain/catalog/shared/RecordCatalog]: index \`${index}\` out of range`
			);
		}
	}

	private sortByPinyin(data: ReadonlyArray<TItem>) {
		return data.toSorted(({ pinyin: a }, { pinyin: b }) =>
			pinyinSort(a, b)
		);
	}
}
