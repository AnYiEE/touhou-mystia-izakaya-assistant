import {type TCustomerRareNames} from '@/data';
import type {IItemBase, TPlace} from '@/data/types';

type TSpeed = '快' | '慢' | '中等';

export interface IPartner extends IItemBase {
	belong: TCustomerRareNames | null;
	effect: `${string}。` | null;
	from:
		| string
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
		moving: TSpeed | '瞬间移动';
		working: TSpeed;
	};
}

export type TPartners = typeof import('./data').PARTNER_LIST;

export type TPartnerNames = TPartners[number]['name'];
