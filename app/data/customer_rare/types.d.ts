import {type TEvaluationKey, type TRecipeTagId} from '@/data';
import type {ICustomerBase, TDescription} from '@/data/types';

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
	negativeTags: TRecipeTag[];
	collection: boolean;
	evaluation: Record<TEvaluationKey, TDescription | null>;
	spellCards: Partial<ISpellCards>;
	positiveTagMapping: Partial<Record<TRecipeTagId, string>>;
	price: `${number}-${number}`;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareId = TCustomerRares[number]['id'];
export type TCustomerRareName = TCustomerRares[number]['name'];
