import {type TRecipeTag} from '@/data';
import type {ICustomerBase, TDescription} from '@/data/types';

export type TRewardType = '摆件' | '采集' | '厨具' | '伙伴' | '料理' | '衣服';

interface ISpellCard {
	name: string;
	description: TDescription;
	/** @todo {type: string} */
}

interface ISpellCards {
	negative: ISpellCard[];
	positive: ISpellCard[];
}

export interface ICustomerRare extends ICustomerBase {
	collection: boolean;
	spellCards: Partial<ISpellCards>;
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: `${number}-${number}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareName = TCustomerRares[number]['name'];
