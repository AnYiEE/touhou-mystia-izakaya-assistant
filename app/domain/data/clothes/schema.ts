import type { TCurrencyName } from '@/domain/data/currencies/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TMerchant } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';

export interface IClothes extends IItemBase {
	/** @description Whether the tachie image of the clothes is a gif. */
	gif: boolean;
	/** @description Whether the clothes will change the izakaya skin. */
	izakaya: boolean;
	from: Array<
		| string
		| Partial<{
				bond: TCustomerRareName;
				buy: {
					name: TMerchant;
					price: { currency: TCurrencyName; amount: number };
				};
				/** @description Initial clothes. */
				self: true;
		  }>
	>;
}
