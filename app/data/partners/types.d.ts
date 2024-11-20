import {type TCustomerRareName, type TPlace, type TSpeed} from '@/data';
import type {IItemBase, TDescription} from '@/data/types';

export interface IPartner extends IItemBase {
	belong: TCustomerRareName[] | null;
	effect: TDescription | null;
	from:
		| TDescription
		| Partial<{
				/** @description Partners by maximize all rare customers bond level in the place. */
				place: TPlace;
				/** @description Initial partners. */
				self: true;
				/** @description Partners by complete the main quests in the place. */
				task: TPlace;
		  }>;
	pay: number;
	speed: {
		moving: TSpeed;
		working: Exclude<TSpeed, '瞬间移动'>;
	};
}

export type TPartners = typeof import('./data').PARTNER_LIST;

export type TPartnerName = TPartners[number]['name'];
