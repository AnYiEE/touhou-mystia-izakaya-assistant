import {type TCustomerRareId, type TPlaceId, type TSpeedId} from '@/data';
import type {IItemBase, TDescription} from '@/data/types';

export interface IPartner extends IItemBase {
	belong: TCustomerRareId[] | null;
	effect: TDescription | null;
	from:
		| TDescription
		| Partial<{
				/** @description Partners by maximize all rare customers bond level in the place. */
				place: TPlaceId;
				/** @description Initial partners. */
				self: true;
				/** @description Partners by complete the main quests in the place. */
				task: TPlaceId;
		  }>;
	pay: number;
	speed: {
		moving: TSpeedId;
		working: Exclude<TSpeedId, -1>;
	};
}

export type TPartners = typeof import('./data').PARTNER_LIST;

export type TPartnerId = TPartners[number]['id'];
export type TPartnerName = TPartners[number]['name'];
