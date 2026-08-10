import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Clothes } from '@/domain/catalog/items/Clothes';
import { Partner } from '@/domain/catalog/items/Partner';
import type { TClothesName } from '@/domain/data/clothes/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TPartnerName } from '@/domain/data/partners/types';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

const { cdnUrl } = PUBLIC_RUNTIME_CONFIG;

const clothesTachiePathCache = new Map<TClothesName, string>();
const customerRareTachiePathCache = new Map<TCustomerRareName, string>();
const partnerTachiePathCache = new Map<TPartnerName, string>();

export function getClothesTachiePath(name: TClothesName) {
	return clothesTachiePathCache.getOrInsertComputed(name, () => {
		const clothes = Clothes.getInstance();
		const { gif, id } = clothes.getPropsByName(name);
		return `${cdnUrl}/assets/tachies/clothes/${clothes.formatId(id)}.${gif ? 'gif' : 'png'}`;
	});
}

export function getCustomerRareTachiePath(name: TCustomerRareName | null) {
	if (name === null) {
		return getClothesTachiePath('夜雀服');
	}
	return customerRareTachiePathCache.getOrInsertComputed(name, () => {
		const customer = CustomerRare.getInstance();
		const basePath = `${cdnUrl}/assets/tachies/customer_rare`;
		return `${basePath}/${customer.formatId(customer.getPropsByName(name, 'id'))}.png`;
	});
}

export function getPartnerTachiePath(name: TPartnerName) {
	return partnerTachiePathCache.getOrInsertComputed(name, () => {
		const partner = Partner.getInstance();
		return `${cdnUrl}/assets/tachies/partners/${partner.formatId(partner.getPropsByName(name, 'id'))}.png`;
	});
}
