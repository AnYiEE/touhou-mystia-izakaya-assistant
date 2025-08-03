import { type TCustomerRareName } from '@/data';
import type { IItemBase, TDescription } from '@/data/types';

export interface IOrnament extends IItemBase {
	effect: TDescription;
	from: TDescription | { bond: TCustomerRareName; level: number };
}

export type TOrnaments = typeof import('./data').ORNAMENT_LIST;

export type TOrnamentName = TOrnaments[number]['name'];
