import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { NORMAL_GUEST_LIST } from '@/domain/data/guests/normal/records';
import type { TNormalGuests } from '@/domain/data/guests/normal/types';

export class NormalGuestCatalog extends RecordCatalog<TNormalGuests> {
	private static _instance: NormalGuestCatalog | undefined;

	public static getInstance() {
		if (NormalGuestCatalog._instance !== undefined) {
			return NormalGuestCatalog._instance;
		}

		const instance = new NormalGuestCatalog(
			NORMAL_GUEST_LIST,
			'normalGuest'
		);

		NormalGuestCatalog._instance = instance;

		return instance;
	}
}
