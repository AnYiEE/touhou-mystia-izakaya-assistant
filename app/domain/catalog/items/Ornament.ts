import { isObject } from 'lodash';

import { Item } from '@/domain/catalog/shared/Item';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import { ORNAMENT_LIST } from '@/domain/data/ornaments/records';
import type { TOrnamentName, TOrnaments } from '@/domain/data/ornaments/types';

import { numberSort } from '@/shared/utilities/sort/numberSort';

type TBondOrnaments = Array<{ level: number; name: TOrnamentName }>;

export class Ornament extends Item<TOrnaments> {
	private static _instance: Ornament | undefined;

	private static _bondOrnamentsCache = new Map<
		TCustomerRareName,
		TBondOrnaments
	>();

	public static getInstance() {
		if (Ornament._instance !== undefined) {
			return Ornament._instance;
		}

		const instance = new Ornament(ORNAMENT_LIST, 'ornament');

		Ornament._instance = instance;

		return instance;
	}

	/**
	 * @description Get the ornaments for a customer based on their bond level.
	 */
	public getBondOrnaments(customerName: TCustomerRareName) {
		if (Ornament._bondOrnamentsCache.has(customerName)) {
			return Ornament._bondOrnamentsCache.get(customerName);
		}

		const bondOrnaments: TBondOrnaments = [];

		this._data.forEach(({ from, name }) => {
			if (isObject(from) && from.bond === customerName) {
				bondOrnaments.push({ level: from.level, name });
			}
		});

		bondOrnaments.sort(({ level: a }, { level: b }) => numberSort(a, b));

		Ornament._bondOrnamentsCache.set(customerName, bondOrnaments);

		return bondOrnaments;
	}
}
