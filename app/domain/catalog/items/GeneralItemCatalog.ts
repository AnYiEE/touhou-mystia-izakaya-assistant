import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { GENERAL_ITEM_LIST } from '@/domain/data/generalItems/records';
import type {
	TGeneralItemId,
	TGeneralItems,
} from '@/domain/data/generalItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { SCHEDULER_FACTS } from '@/domain/data/labels/schedulerFacts';

import { numberSort } from '@/shared/utilities/sort/numberSort';

type TBondGeneralItems = Array<{ id: TGeneralItemId; level: number }>;

export class GeneralItemCatalog extends RecordCatalog<TGeneralItems> {
	private static _instance: GeneralItemCatalog | undefined;
	private static readonly _bondGeneralItemsCache = new Map<
		TSpecialGuestId,
		TBondGeneralItems
	>();

	public static getInstance() {
		if (GeneralItemCatalog._instance !== undefined) {
			return GeneralItemCatalog._instance;
		}

		const instance = new GeneralItemCatalog(
			GENERAL_ITEM_LIST,
			'generalItem'
		);
		GeneralItemCatalog._instance = instance;

		return instance;
	}

	public getBondGeneralItemsBySpecialGuest(specialGuest: TSpecialGuestId) {
		return GeneralItemCatalog._bondGeneralItemsCache.getOrInsertComputed(
			specialGuest,
			() => {
				const bondGeneralItems: TBondGeneralItems = [];

				this._data.forEach(({ from, id }) => {
					from.forEach((source) => {
						if (!('schedulerLabel' in source)) {
							return;
						}
						const fact = SCHEDULER_FACTS[source.schedulerLabel];
						if (
							'specialGuestBond' in fact &&
							fact.specialGuestBond.specialGuest === specialGuest
						) {
							bondGeneralItems.push({
								id,
								level: fact.specialGuestBond.level,
							});
						}
					});
				});

				bondGeneralItems.sort(({ level: a }, { level: b }) =>
					numberSort(a, b)
				);

				return bondGeneralItems;
			}
		);
	}
}
