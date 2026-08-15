import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { CLOTHES_LIST } from '@/domain/data/clothes/records';
import type { TClothes, TClothesId } from '@/domain/data/clothes/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

export class ClothesCatalog extends RecordCatalog<TClothes> {
	private static _instance: ClothesCatalog | undefined;
	private static readonly _bondClothesCache = new Map<
		TSpecialGuestId,
		TClothesId | null
	>();

	public static getInstance() {
		if (ClothesCatalog._instance !== undefined) {
			return ClothesCatalog._instance;
		}

		const instance = new ClothesCatalog(CLOTHES_LIST, 'clothes');
		ClothesCatalog._instance = instance;

		return instance;
	}

	public getBondClothesBySpecialGuest(
		specialGuest: TSpecialGuestId
	): TClothesId | null {
		return ClothesCatalog._bondClothesCache.getOrInsertComputed(
			specialGuest,
			() => {
				let bondClothes: TClothesId | null = null;

				this._data.some(({ from, id }) =>
					from.some((item) => {
						if (
							'bond' in item &&
							item.bond.specialGuest === specialGuest
						) {
							bondClothes = id;
							return true;
						}
						return false;
					})
				);

				return bondClothes;
			}
		);
	}
}
