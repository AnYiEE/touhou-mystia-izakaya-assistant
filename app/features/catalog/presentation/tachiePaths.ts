import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TClothesId } from '@/domain/data/clothes/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TPartnerId } from '@/domain/data/partners/types';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

const { cdnUrl } = PUBLIC_RUNTIME_CONFIG;

const clothesTachiePathCache = new Map<TClothesId, string>();
const partnerTachiePathCache = new Map<TPartnerId, string>();
const specialGuestTachiePathCache = new Map<TSpecialGuestId, string>();

export function getClothesTachiePath(id: TClothesId) {
	return clothesTachiePathCache.getOrInsertComputed(id, () => {
		const clothes = ClothesCatalog.getInstance();
		const { gif } = clothes.getPropsById(id);
		return `${cdnUrl}/assets/tachies/clothes/${clothes.formatId(id)}.${gif ? 'gif' : 'png'}`;
	});
}

export function getSpecialGuestTachiePath(id: TSpecialGuestId) {
	return specialGuestTachiePathCache.getOrInsertComputed(id, () => {
		const specialGuest = SpecialGuestCatalog.getInstance();
		const basePath = `${cdnUrl}/assets/tachies/special_guest`;
		return `${basePath}/${specialGuest.formatId(id)}.png`;
	});
}

export function getPartnerTachiePath(id: TPartnerId) {
	return partnerTachiePathCache.getOrInsertComputed(id, () => {
		const partner = PartnerCatalog.getInstance();
		return `${cdnUrl}/assets/tachies/partners/${partner.formatId(id)}.png`;
	});
}
