import {siteConfig} from '@/configs';
import {PARTNER_LIST, type TCustomerRareId, type TPartnerId, type TPartners} from '@/data';
import {processPinyin} from '@/utils';
import {Item} from '@/utils/item';

const {cdnUrl} = siteConfig;

export class Partner extends Item<TPartners> {
	private static _instance: Partner | undefined;

	private static _bondPartnerCache = new Map<TCustomerRareId, TPartnerId | null>();
	private static _tachiePathCache = new Map<TPartnerId, string>();

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
	public getBondPartner(customerId: TCustomerRareId) {
		if (Partner._bondPartnerCache.has(customerId)) {
			return Partner._bondPartnerCache.get(customerId);
		}

		let bondPartner: TPartnerId | null = null;

		this._data.some(({belong, id}) => {
			if ((belong as TCustomerRareId[] | null)?.includes(customerId)) {
				bondPartner = id;
				return true;
			}
			return false;
		});

		Partner._bondPartnerCache.set(customerId, bondPartner);

		return bondPartner;
	}

	/**
	 * @description Get the tachie image path for a partner.
	 */
	public getTachiePath(id: TPartnerId) {
		const basePath = `${cdnUrl}/assets/tachies/partners`;

		let path: string;

		if (Partner._tachiePathCache.has(id)) {
			path = Partner._tachiePathCache.get(id);
		} else {
			const pinyin = this.getPropsById(id, 'pinyin');
			path = `${basePath}/${processPinyin(pinyin).pinyinWithoutTone.join('')}.png`;
			Partner._tachiePathCache.set(id, path);
		}

		return path;
	}
}
