import { isAvailableWithHiddenDlcs } from '@/domain/availability/catalog';
import type { IAvailabilityPath } from '@/domain/availability/types';
import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { SPECIAL_GUEST_LIST } from '@/domain/data/guests/special/records';
import type { TSpecialGuests } from '@/domain/data/guests/special/types';
import type { TDlc } from '@/domain/data/shared/types';

export class SpecialGuestCatalog extends RecordCatalog<TSpecialGuests> {
	private static _instance: SpecialGuestCatalog | undefined;

	public static getInstance() {
		if (SpecialGuestCatalog._instance !== undefined) {
			return SpecialGuestCatalog._instance;
		}

		const instance = new SpecialGuestCatalog(
			SPECIAL_GUEST_LIST,
			'specialGuest'
		);

		SpecialGuestCatalog._instance = instance;

		return instance;
	}

	public isVisibleWithHiddenDlcs(
		guest: { availabilityPaths: ReadonlyArray<IAvailabilityPath> },
		hiddenDlcs: ReadonlySet<TDlc>
	) {
		return isAvailableWithHiddenDlcs(guest.availabilityPaths, hiddenDlcs);
	}
}
