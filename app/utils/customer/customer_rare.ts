import {Customer} from './base';
import {siteConfig} from '@/configs';
import {CUSTOMER_RARE_LIST, type TCustomerRareName, type TCustomerRares} from '@/data';
import {Clothes} from '@/utils';

import {processPinyin} from '@/utilities';

const {cdnUrl} = siteConfig;

export class CustomerRare extends Customer<TCustomerRares> {
	private static _instance: CustomerRare | undefined;

	private static _tachiePathCache = new Map<TCustomerRareName, string>();

	public static getInstance() {
		if (CustomerRare._instance !== undefined) {
			return CustomerRare._instance;
		}

		const instance = new CustomerRare(CUSTOMER_RARE_LIST);

		CustomerRare._instance = instance;

		return instance;
	}

	public getTachiePath(customerName: TCustomerRareName | null) {
		if (customerName === null) {
			return Clothes.getInstance().getTachiePath('夜雀服');
		}

		const basePath = `${cdnUrl}/assets/tachies/customer_rare`;

		let path: string;

		if (CustomerRare._tachiePathCache.has(customerName)) {
			path = CustomerRare._tachiePathCache.get(customerName);
		} else {
			path = `${basePath}/${processPinyin(this.getPropsByName(customerName, 'pinyin')).pinyinWithoutTone.join('')}.png`;
			CustomerRare._tachiePathCache.set(customerName, path);
		}

		return path;
	}
}
