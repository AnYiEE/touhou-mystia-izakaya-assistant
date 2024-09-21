import {isObjectLike, sortBy} from 'lodash';

import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';

import {ORNAMENT_LIST, type TOrnamentNames, type TOrnaments} from '@/data';
import {Item} from '@/utils/item';

type TBondOrnaments = {
	level: number;
	name: TOrnamentNames;
}[];

export class Ornament extends Item<TOrnaments> {
	private static _instance: Ornament | undefined;

	private static _bondOrnamentsCache = new Map<ICurrentCustomer['name'], TBondOrnaments>();

	public static getInstance() {
		if (Ornament._instance) {
			return Ornament._instance;
		}

		const instance = new Ornament(ORNAMENT_LIST);

		Ornament._instance = instance;

		return instance;
	}

	/**
	 * @description Get the ornaments for a customer based on their bond level.
	 */
	public getBondOrnaments(customerData: ICurrentCustomer) {
		if (Ornament._bondOrnamentsCache.has(customerData.name)) {
			return Ornament._bondOrnamentsCache.get(customerData.name);
		}

		let bondOrnaments: TBondOrnaments = [];

		this._data.forEach(({from, name}) => {
			if (isObjectLike(from) && from.name === customerData.name) {
				bondOrnaments.push({
					level: from.level,
					name,
				});
			}
		});

		bondOrnaments = sortBy(bondOrnaments, 'level');

		Ornament._bondOrnamentsCache.set(customerData.name, bondOrnaments);

		return bondOrnaments;
	}
}
