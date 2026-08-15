import type { IGuestBase } from '@/domain/data/shared/guestSchema';
import type { TDescription } from '@/domain/data/shared/types';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

interface ISpellCard {
	description: TDescription;
	name: string;
}

interface ISpellCards {
	negative: ISpellCard[];
	positive: ISpellCard[];
}

export type TSpecialGuestEvaluationKey =
	| 'exbad'
	| 'bad'
	| 'norm'
	| 'good'
	| 'exgood'
	| 'lackmoneynormal'
	| 'lackmoneyangry'
	| 'repell'
	| 'seenRepell';

export interface ISpecialGuest extends IGuestBase {
	beverageTagMapping: Partial<Record<TBeverageTagId, string>>;
	collection: boolean;
	enduranceLimit: number;
	evaluation: Record<TSpecialGuestEvaluationKey, TDescription | null>;
	negativeTags: TFoodTagId[];
	positiveTagMapping: Partial<Record<TFoodTagId, string>>;
	price: [number, number];
	spellCards: Partial<ISpellCards>;
}
