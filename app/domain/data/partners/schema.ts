import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TPlace } from '@/domain/data/places/types';
import type { IItemBase } from '@/domain/data/shared/itemSchema';
import type { TDescription, TSpeed } from '@/domain/data/shared/types';

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
	speed: { moving: TSpeed; working: Exclude<TSpeed, '瞬间移动'> };
}
