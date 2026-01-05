import {
	type TBeverageTag,
	type TEvaluationKey,
	type TRecipeTag,
} from '@/data';
import type { ICustomerBase, TDescription } from '@/data/types';

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
	beverageTagMapping: Partial<Record<TBeverageTag, string>>;
	positiveTagMapping: Partial<Record<TRecipeTag, string>>;
	price: [number, number];
	enduranceLimit: number;
}

export type TCustomerRares = typeof import('./data').CUSTOMER_RARE_LIST;

export type TCustomerRareName = TCustomerRares[number]['name'];
