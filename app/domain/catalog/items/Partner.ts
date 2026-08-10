import { Item } from '@/domain/catalog/shared/Item';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import { PARTNER_LIST } from '@/domain/data/partners/records';
import type { TPartnerName, TPartners } from '@/domain/data/partners/types';

export class Partner extends Item<TPartners> {
	private static _instance: Partner | undefined;

	private static _bondPartnerCache = new Map<
		TCustomerRareName,
		TPartnerName | null
	>();
	public static getInstance() {
		if (Partner._instance !== undefined) {
			return Partner._instance;
		}

		const instance = new Partner(PARTNER_LIST, 'partner');

		Partner._instance = instance;

		return instance;
	}

	/**
	 * @description Get the partner for a customer based on their bond level.
	 */
	public getBondPartner(
		customerName: TCustomerRareName
	): TPartnerName | null {
		return Partner._bondPartnerCache.getOrInsertComputed(
			customerName,
			() => {
				let bondPartner: TPartnerName | null = null;

				this._data.some(({ belong, name }) => {
					if (
						(belong as TCustomerRareName[] | null)?.includes(
							customerName
						)
					) {
						bondPartner = name;
						return true;
					}
					return false;
				});

				return bondPartner;
			}
		);
	}
}
