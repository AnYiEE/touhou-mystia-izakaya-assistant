import {pinyin as pinyinPro} from 'pinyin-pro';

import {generateArray} from '@/utils';

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
	public getPropsByIndex<T extends keyof ItemWithPinyin>(
		index: number,
		prop?: T
	): ItemWithPinyin | ItemWithPinyin[T] {
		const item = this._dataWithPinyin[index];
		this.checkIndexRange(index, item);

		if (prop) {
			return item[prop];
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
	>(name: T, prop?: S): ItemWithPinyin | ItemWithPinyin[S] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<S>(index, prop as NonNullable<typeof prop>);
	}

	public getValuesByProp<T extends keyof ItemWithPinyin>(
		data: ItemWithPinyin[],
		prop: T | T[],
		wrap: true
	): {value: FlatArray<ItemWithPinyin[T], number>}[];
	public getValuesByProp<T extends keyof ItemWithPinyin>(
		data: ItemWithPinyin[],
		prop: T | T[],
		wrap?: false
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
		const getTone = (pinyin: string): number => parseInt(pinyin.match(/\d/)?.[0] ?? '0');
		const removeTone = (pinyin: string): string => pinyin.replace(/\d/, '');

		return data.toSorted(({pinyin: a}, {pinyin: b}) => {
			const length = Math.min(a.length, b.length);

			for (let i = 0; i < length; i++) {
				const itemA = a[i] as string;
				const itemB = b[i] as string;

				const pinyinA = removeTone(itemA);
				const pinyinB = removeTone(itemB);
				if (pinyinA < pinyinB) {
					return -1;
				}
				if (pinyinA > pinyinB) {
					return 1;
				}

				const toneA = getTone(itemA);
				const toneB = getTone(itemB);
				if (toneA !== toneB) {
					return toneA - toneB;
				}
			}

			return a.length - b.length;
		});
	}
}
