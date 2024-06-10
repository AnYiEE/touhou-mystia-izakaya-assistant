import {pinyin as pinyinPro} from 'pinyin-pro';

import type {IItem, TItemProcessed} from './types';

class Item<
	Target extends IItem[],
	Item extends Target[number] = Target[number],
	Name extends Item['name'] = Item['name'],
	ItemProcessed extends TItemProcessed<Item> = TItemProcessed<Item>,
> {
	protected _data: Target;
	protected _dataWithPinyin: ItemProcessed[];

	protected pinyinSortedCache: ItemProcessed[] | undefined;
	protected static indexNameCache: Map<number, string> = new Map();
	protected static nameIndexCache: Map<string, number> = new Map();

	public constructor(data: Target) {
		this._data = structuredClone(data);
		this._dataWithPinyin = structuredClone(this._data).map(
			(item) =>
				({
					...item,
					pinyin: pinyinPro(item.name as string, {
						toneType: 'num',
						type: 'array',
						v: true,
					}),
				}) as ItemProcessed
		);
	}

	public get data() {
		return structuredClone(this._dataWithPinyin);
	}

	public get dataPinyinSorted(): ItemProcessed[] {
		if (this.pinyinSortedCache) {
			return structuredClone(this.pinyinSortedCache);
		}

		const getTone = (pinyin: string): number => parseInt(pinyin.match(/\d/)?.[0] ?? '0');
		const removeTone = (pinyin: string): string => pinyin.replace(/\d/, '');

		this.pinyinSortedCache = this.data.sort(({pinyin: a}, {pinyin: b}) => {
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

		const index: number = this._data.findIndex(({name: target}) => target === name);
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

	public getPropsByIndex(index: number): ItemProcessed;
	public getPropsByIndex<T extends ItemProcessed>(index: number, prop: keyof T): T[keyof T];
	public getPropsByIndex<T extends ItemProcessed>(index: number, prop?: keyof T): T | T[keyof T] {
		const item = this._dataWithPinyin[index];
		this.checkIndexRange(index, item);

		if (!prop) {
			return structuredClone(item as T);
		}

		return structuredClone(item[prop as keyof IItem] as T[keyof T]);
	}

	public getPropsByName(name: Name): ItemProcessed;
	public getPropsByName<T extends ItemProcessed, U extends Exclude<keyof T, 'name'>>(name: Name, prop: U): T[U];
	public getPropsByName<T extends ItemProcessed, U extends Exclude<keyof T, 'name'>>(name: Name, prop?: U): T | T[U] {
		const index = this.findIndexByName(name);

		return this.getPropsByIndex<T>(index, prop as NonNullable<typeof prop>) as T | T[U];
	}
}

export {Item};
