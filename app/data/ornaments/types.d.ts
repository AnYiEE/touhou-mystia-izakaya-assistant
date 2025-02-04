import {type TCustomerRareId} from '@/data';
import type {IItemBase, TDescription} from '@/data/types';

export interface IOrnament extends IItemBase {
	effect: TDescription;
	from:
		| TDescription
		| {
				bond: TCustomerRareId;
				level: number;
		  };
}

export type TOrnaments = typeof import('./data').ORNAMENT_LIST;

export type TOrnamentId = TOrnaments[number]['id'];
export type TOrnamentName = TOrnaments[number]['name'];
