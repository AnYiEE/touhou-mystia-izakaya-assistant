import {Customer} from './base';
import {siteConfig} from '@/configs';
import {CUSTOMER_RARE_LIST, type TCustomerRareId, type TCustomerRares} from '@/data';
import {Clothes, processPinyin} from '@/utils';

const {cdnUrl} = siteConfig;

export class CustomerRare extends Customer<TCustomerRares> {
	private static _instance: CustomerRare | undefined;

	private static _tachiePathCache = new Map<TCustomerRareId, string>();

	public static getInstance() {
		if (CustomerRare._instance !== undefined) {
			return CustomerRare._instance;
		}

		const instance = new CustomerRare(CUSTOMER_RARE_LIST);

		CustomerRare._instance = instance;

		return instance;
	}

	public getTachiePath(customerId: TCustomerRareId | null) {
		if (customerId === null) {
			return Clothes.getInstance().getTachiePath(-1);
		}

		const basePath = `${cdnUrl}/assets/tachies/customer_rare`;

		let path: string;

		if (CustomerRare._tachiePathCache.has(customerId)) {
			path = CustomerRare._tachiePathCache.get(customerId);
		} else {
			path = `${basePath}/${processPinyin(this.getPropsById(customerId, 'pinyin')).pinyinWithoutTone.join('')}.png`;
			CustomerRare._tachiePathCache.set(customerId, path);
		}

		return path;
	}
}
