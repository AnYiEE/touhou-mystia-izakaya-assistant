import type { ICustomerBase } from '@/domain/data/shared/customerSchema';
import type { TDescription } from '@/domain/data/shared/types';
import type {
	TBeverageTagSchema,
	TRecipeTagSchema,
} from '@/domain/data/tags/schema';

interface ISpellCard {
	name: string;
	description: TDescription;
	/** @todo {type: string} */
}

interface ISpellCards {
	negative: ISpellCard[];
	positive: ISpellCard[];
}

export type TEvaluationKeySchema =
	| 'exbad'
	| 'bad'
	| 'norm'
	| 'good'
	| 'exgood'
	| 'lackmoneynormal'
	| 'lackmoneyangry'
	| 'repell'
	| 'seenRepell';

export interface ICustomerRare extends ICustomerBase {
	negativeTags: TRecipeTagSchema[];
	collection: boolean;
	evaluation: Record<TEvaluationKeySchema, TDescription | null>;
	spellCards: Partial<ISpellCards>;
	beverageTagMapping: Partial<Record<TBeverageTagSchema, string>>;
	positiveTagMapping: Partial<Record<TRecipeTagSchema, string>>;
	price: [number, number];
	enduranceLimit: number;
}
