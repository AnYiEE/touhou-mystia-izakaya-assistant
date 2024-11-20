import {isObjectLike, sortBy} from 'lodash';

import {ORNAMENT_LIST, type TCustomerRareId, type TOrnamentId, type TOrnaments} from '@/data';
import {Item} from '@/utils/item';

type TBondOrnaments = {
	id: TOrnamentId;
	level: number;
}[];

export class Ornament extends Item<TOrnaments> {
	private static _instance: Ornament | undefined;

	private static _bondOrnamentsCache = new Map<TCustomerRareId, TBondOrnaments>();

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
	public getBondOrnaments(customerId: TCustomerRareId) {
		if (Ornament._bondOrnamentsCache.has(customerId)) {
			return Ornament._bondOrnamentsCache.get(customerId);
		}

		let bondOrnaments: TBondOrnaments = [];

		this._data.forEach(({from, id}) => {
			if (isObjectLike(from) && from.bond === customerId) {
				bondOrnaments.push({
					id,
					level: from.level,
				});
			}
		});

		bondOrnaments = sortBy(bondOrnaments, 'level');

		Ornament._bondOrnamentsCache.set(customerId, bondOrnaments);

		return bondOrnaments;
	}
}
