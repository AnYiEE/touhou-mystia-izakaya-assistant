import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';

import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';

export function selectCatalogGuest(
	section: 'normal-guests' | 'special-guests',
	recordId: number
) {
	if (section === 'normal-guests') {
		const normalGuest = NormalGuestCatalog.getInstance().getPropsById(
			recordId as TNormalGuestId,
			'id'
		);
		normalGuestStore.onGuestSelectedChange(normalGuest);
		return;
	}

	const specialGuest = SpecialGuestCatalog.getInstance().getPropsById(
		recordId as TSpecialGuestId,
		'id'
	);
	specialGuestStore.onGuestSelectedChange(specialGuest);
}
