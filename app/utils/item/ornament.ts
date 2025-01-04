import {isObjectLike, sortBy} from 'lodash';

import {ORNAMENT_LIST, type TCustomerRareName, type TOrnamentName, type TOrnaments} from '@/data';
import {Item} from '@/utils/item';

type TBondOrnaments = {
	level: number;
	name: TOrnamentName;
}[];

export class Ornament extends Item<TOrnaments> {
	private static _instance: Ornament | undefined;

	private static _bondOrnamentsCache = new Map<TCustomerRareName, TBondOrnaments>();

	public static getInstance() {
		if (Ornament._instance !== undefined) {
			return Ornament._instance;
		}

		const instance = new Ornament(ORNAMENT_LIST);

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

		let bondOrnaments: TBondOrnaments = [];

		this._data.forEach(({from, name}) => {
			if (isObjectLike(from) && from.bond === customerName) {
				bondOrnaments.push({
					level: from.level,
					name,
				});
			}
		});

		bondOrnaments = sortBy(bondOrnaments, 'level');

		Ornament._bondOrnamentsCache.set(customerName, bondOrnaments);

		return bondOrnaments;
	}
}
