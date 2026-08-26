import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { BADGE_LIST } from '@/domain/data/badges/records';
import type { TBadges } from '@/domain/data/badges/types';

export class BadgeCatalog extends RecordCatalog<TBadges> {
	private static _instance: BadgeCatalog | undefined;

	public static getInstance() {
		if (BadgeCatalog._instance !== undefined) {
			return BadgeCatalog._instance;
		}

		const instance = new BadgeCatalog(BADGE_LIST, 'badge');
		BadgeCatalog._instance = instance;

		return instance;
	}
}
