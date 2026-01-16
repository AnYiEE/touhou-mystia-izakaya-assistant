import { Item } from './base';
import {
	PARTNER_LIST,
	type TCustomerRareName,
	type TPartnerName,
	type TPartners,
} from '@/data';

import { siteConfig } from '@/configs';
import { processPinyin } from '@/utilities';

const { cdnUrl } = siteConfig;

export class Partner extends Item<TPartners> {
	private static _instance: Partner | undefined;

	private static _bondPartnerCache = new Map<
		TCustomerRareName,
		TPartnerName | null
	>();
	private static _tachiePathCache = new Map<TPartnerName, string>();

	public static getInstance() {
		if (Partner._instance !== undefined) {
			return Partner._instance;
		}

		const instance = new Partner(PARTNER_LIST);

		Partner._instance = instance;

		return instance;
	}

	/**
	 * @description Get the partner for a customer based on their bond level.
	 */
	public getBondPartner(
		customerName: TCustomerRareName
	): TPartnerName | null {
		if (Partner._bondPartnerCache.has(customerName)) {
			return Partner._bondPartnerCache.get(customerName);
		}

		let bondPartner: TPartnerName | null = null;

		this._data.some(({ belong, name }) => {
			if (
				(belong as TCustomerRareName[] | null)?.includes(customerName)
			) {
				bondPartner = name;
				return true;
			}
			return false;
		});

		Partner._bondPartnerCache.set(customerName, bondPartner);

		return bondPartner;
	}

	/**
	 * @description Get the tachie image path for a partner.
	 */
	public getTachiePath(name: TPartnerName) {
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
