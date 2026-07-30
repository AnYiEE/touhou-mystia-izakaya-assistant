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
	if (clothesTachiePathCache.has(name)) {
		return clothesTachiePathCache.get(name);
	}

	const clothes = Clothes.getInstance();
	const { gif, id } = clothes.getPropsByName(name);
	const path = `${cdnUrl}/assets/tachies/clothes/${clothes.formatId(id)}.${gif ? 'gif' : 'png'}`;
	clothesTachiePathCache.set(name, path);

	return path;
}

export function getCustomerRareTachiePath(name: TCustomerRareName | null) {
	if (name === null) {
		return getClothesTachiePath('夜雀服');
	}
	if (customerRareTachiePathCache.has(name)) {
		return customerRareTachiePathCache.get(name);
	}

	const customer = CustomerRare.getInstance();
	const basePath = `${cdnUrl}/assets/tachies/customer_rare`;
	const path = `${basePath}/${customer.formatId(customer.getPropsByName(name, 'id'))}.png`;
	customerRareTachiePathCache.set(name, path);

	return path;
}

export function getPartnerTachiePath(name: TPartnerName) {
	if (partnerTachiePathCache.has(name)) {
		return partnerTachiePathCache.get(name);
	}

	const partner = Partner.getInstance();
	const path = `${cdnUrl}/assets/tachies/partners/${partner.formatId(partner.getPropsByName(name, 'id'))}.png`;
	partnerTachiePathCache.set(name, path);

	return path;
}
