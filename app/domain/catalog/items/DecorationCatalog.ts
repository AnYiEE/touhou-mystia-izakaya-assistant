import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { DECORATION_LIST } from '@/domain/data/decorations/records';
import type {
	TDecorationId,
	TDecorations,
} from '@/domain/data/decorations/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

import { numberSort } from '@/shared/utilities/sort/numberSort';

type TBondDecorations = Array<{ id: TDecorationId; level: number }>;

export class DecorationCatalog extends RecordCatalog<TDecorations> {
	private static _instance: DecorationCatalog | undefined;
	private static readonly _bondDecorationsCache = new Map<
		TSpecialGuestId,
		TBondDecorations
	>();

	public static getInstance() {
		if (DecorationCatalog._instance !== undefined) {
			return DecorationCatalog._instance;
		}

		const instance = new DecorationCatalog(DECORATION_LIST, 'decoration');
		DecorationCatalog._instance = instance;

		return instance;
	}

	public getBondDecorationsBySpecialGuest(specialGuest: TSpecialGuestId) {
		return DecorationCatalog._bondDecorationsCache.getOrInsertComputed(
			specialGuest,
			() => {
				const bondDecorations: TBondDecorations = [];

				this._data.forEach(({ from, id }) => {
					if (
						'bond' in from &&
						from.bond.specialGuest === specialGuest
					) {
						bondDecorations.push({ id, level: from.bond.level });
					}
				});

				bondDecorations.sort(({ level: a }, { level: b }) =>
					numberSort(a, b)
				);

				return bondDecorations;
			}
		);
	}
}
