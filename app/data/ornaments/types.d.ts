import {type TCustomerRareNames} from '@/data';
import type {IItemBase, TDescription} from '@/data/types';

export interface IOrnament extends IItemBase {
	effect: TDescription;
	from:
		| TDescription
		| {
				name: TCustomerRareNames;
				level: number;
		  };
}

export type TOrnaments = typeof import('./data').ORNAMENT_LIST;

export type TOrnamentNames = TOrnaments[number]['name'];
