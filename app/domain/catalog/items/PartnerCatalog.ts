import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import type { TPartnerId, TPartners } from '@/domain/data/partners/types';

export class PartnerCatalog extends RecordCatalog<TPartners> {
	private static _instance: PartnerCatalog | undefined;
	private static readonly _bondPartnerCache = new Map<
		TSpecialGuestId,
		TPartnerId | null
	>();

	public static getInstance() {
		if (PartnerCatalog._instance !== undefined) {
			return PartnerCatalog._instance;
		}

		const instance = new PartnerCatalog(PARTNER_LIST, 'partner');
		PartnerCatalog._instance = instance;

		return instance;
	}

	public getBondPartnerBySpecialGuest(
		specialGuest: TSpecialGuestId
	): TPartnerId | null {
		return PartnerCatalog._bondPartnerCache.getOrInsertComputed(
			specialGuest,
			() => {
				let bondPartner: TPartnerId | null = null;

				this._data.some(({ id, specialGuests }) => {
					if (
						(
							specialGuests as ReadonlyArray<TSpecialGuestId> | null
						)?.includes(specialGuest)
					) {
						bondPartner = id;
						return true;
					}
					return false;
				});

				return bondPartner;
			}
		);
	}
}
