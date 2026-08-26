import type { IGuestBase } from '@/domain/data/shared/guestSchema';
import type { TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';

interface ISpellCard {
	description: string;
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
	collaboration?: TCollaborationLabel;
	enduranceLimit: number;
	evaluation: Record<TSpecialGuestEvaluationKey, string | null>;
	negativeTags: TFoodTagId[];
	positiveTagMapping: Partial<Record<TFoodTagId, string>>;
	price: [number, number];
	spellCards: Partial<ISpellCards>;
}
