import {type ICurrentCustomer} from '@/(pages)/customer-rare/types';

import {siteConfig} from '@/configs';
import {PARTNER_LIST, type TPartnerNames, type TPartners} from '@/data';
import {processPinyin} from '@/utils';
import {Item} from '@/utils/item';

const {cdnUrl} = siteConfig;

export class Partner extends Item<TPartners> {
	private static _instance: Partner | undefined;

	private static _bondPartnerCache = new Map<ICurrentCustomer['name'], TPartnerNames | null>();
	private static _tachiePathCache = new Map<TPartnerNames, string>();

	public static getInstance() {
		if (Partner._instance) {
			return Partner._instance;
		}

		const instance = new Partner(PARTNER_LIST);

		Partner._instance = instance;

		return instance;
	}

	/**
	 * @description Get the partner for a customer based on their bond level.
	 */
	public getBondPartner(customerData: ICurrentCustomer) {
		if (Partner._bondPartnerCache.has(customerData.name)) {
			return Partner._bondPartnerCache.get(customerData.name);
		}

		let bondPartner: TPartnerNames | null = null;

		this._data.forEach(({belong, name}) => {
			if ((belong as ICurrentCustomer['name'][] | null)?.includes(customerData.name)) {
				bondPartner = name;
			}
		});

		Partner._bondPartnerCache.set(customerData.name, bondPartner);

		return bondPartner;
	}

	/**
	 * @description Get the tachie image path for a partner.
	 */
	public getTachiePath(name: TPartnerNames) {
		const basePath = `${cdnUrl}/assets/tachies/partners`;

		let path: string;

		if (Partner._tachiePathCache.has(name)) {
			path = Partner._tachiePathCache.get(name);
		} else {
			const pinyin = this.getPropsByName(name, 'pinyin');
			path = `${basePath}/${processPinyin(pinyin).pinyinWithoutTone.join('')}.png`;
			Partner._tachiePathCache.set(name, path);
		}

		return path;
	}
}
